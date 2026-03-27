#!/usr/bin/env node

import { spawn } from 'node:child_process';
import net from 'node:net';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const FRONTEND_PORT_BASE = 5191;
const BACKEND_PORT_BASE = 4001;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForUrl(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function findAvailablePort(startPort) {
  let port = startPort;
  while (port < 65535) {
    const available = await new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => resolve(false));
      server.listen(port, HOST, () => {
        server.close(() => resolve(true));
      });
    });

    if (available) {
      return port;
    }
    port += 1;
  }

  throw new Error(`Unable to find available port starting from ${startPort}`);
}

function spawnNpm(args, label, envOverrides = {}) {
  const npmExecPath = process.env.npm_execpath;
  if (!npmExecPath) {
    throw new Error('npm_execpath is unavailable; run this script via npm.');
  }

  const proc = spawn(process.execPath, [npmExecPath, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  proc.stdout.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });

  proc.stderr.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });

  proc.on('error', (err) => {
    process.stderr.write(`[${label}] spawn error: ${err.message}\n`);
  });

  return proc;
}

function terminateProcess(proc) {
  if (!proc || proc.killed) return;
  proc.kill();
}

async function runScenarios(frontendUrl, backendUrl, backendHealthUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript((apiBaseUrl) => {
    window.__API_BASE_URL = apiBaseUrl;
  }, backendUrl);
  const page = await context.newPage();

  try {
    const healthRes = await context.request.get(backendHealthUrl);
    if (!healthRes.ok()) {
      throw new Error(`Health endpoint did not return 200. Status: ${healthRes.status()}`);
    }

    await page.goto(`${frontendUrl}/intro`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: /cognitive assessment|evaluacion cognitiva/i }).waitFor({ timeout: 15_000 });
    await page.getByRole('button', { name: /quick demo|demo rapida/i }).click();
    await page.waitForURL('**/game/1');
    await page.locator('div').filter({ hasText: /1\s*\/\s*13/ }).first().waitFor({ timeout: 15_000 });

    await page.goto(`${frontendUrl}/game/8`, { waitUntil: 'networkidle' });

    const consentContinue = page.getByRole('button', { name: 'Continuar con la Evaluación' });
    if (await consentContinue.isVisible().catch(() => false)) {
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      if (count >= 3) {
        await checkboxes.nth(2).check();
      }
      await consentContinue.click();
    }

    await page.getByRole('button', { name: /listo, comenzar juego|ready, start game/i }).click();
    await page.getByText(/complementary game 1|juego complementario 1|metacognitive calibration|calibracion metacognitiva/i).waitFor({ timeout: 15_000 });
    await page.locator('div').filter({ hasText: /8\s*\/\s*13/ }).first().waitFor({ timeout: 15_000 });

    await page.goto(`${frontendUrl}/recruiter/login?qa=1`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /enter qa dashboard|continue offline/i }).first().click();
    await page.waitForURL('**/recruiter/dashboard**');
    await page.getByRole('heading', { name: /recruiter dashboard/i }).waitFor({ timeout: 15_000 });
    await page.waitForTimeout(1000);

    const recruiterUrl = page.url();
    if (!recruiterUrl.includes('/recruiter/dashboard')) {
      throw new Error(`Recruiter route did not stabilize on dashboard. Current URL: ${recruiterUrl}`);
    }

    const storedToken = await page.evaluate(() => sessionStorage.getItem('participantToken'));
    if (!storedToken) {
      throw new Error('Recruiter session token was not stored in sessionStorage');
    }

    console.log('\nE2E scenarios passed');
  } finally {
    await context.close();
    await browser.close();
  }
}

async function runBackendDownFallbackScenario(frontendUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${frontendUrl}/report?dummy=true`, { waitUntil: 'domcontentloaded' });

    await page.getByText(/insight source\s*:\s*heuristic|fuente de insight\s*:\s*heuristic/i).waitFor({ timeout: 20_000 });

    await page.getByText(/next step|siguiente paso/i).waitFor({ timeout: 20_000 });
    await page.getByText(/npm run dev:server/i).waitFor({ timeout: 20_000 });

    console.log('E2E backend-down fallback scenario passed');
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const frontendPort = await findAvailablePort(FRONTEND_PORT_BASE);
  const backendPort = await findAvailablePort(BACKEND_PORT_BASE);
  const frontendUrl = `http://${HOST}:${frontendPort}`;
  const backendUrl = `http://${HOST}:${backendPort}`;
  const backendHealthUrl = `${backendUrl}/health`;

  const frontendProc = spawnNpm(
    ['run', 'dev:frontend', '--', '--host', HOST, '--port', String(frontendPort), '--strictPort', '--open', 'false'],
    'frontend',
    {
      VITE_API_BASE_URL: backendUrl,
      VITE_PROXY_BASE_FALLBACK: 'false',
      VITE_ALLOW_BROWSER_GEMINI_FALLBACK: 'false',
    }
  );
  const backendProc = spawnNpm(['run', 'dev:server'], 'backend', { PORT: String(backendPort) });

  const cleanup = () => {
    terminateProcess(frontendProc);
    terminateProcess(backendProc);
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });

  try {
    await Promise.all([
      waitForUrl(frontendUrl),
      waitForUrl(backendHealthUrl),
    ]);

    await runScenarios(frontendUrl, backendUrl, backendHealthUrl);
    terminateProcess(backendProc);
    await sleep(1200);
    await runBackendDownFallbackScenario(frontendUrl);
    cleanup();
    process.exit(0);
  } catch (error) {
    console.error(`\nE2E failed: ${error.message}`);
    if (error?.stack) {
      console.error(error.stack);
    }
    cleanup();
    process.exit(1);
  }
}

main();