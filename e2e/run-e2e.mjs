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

async function isUrlUp(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
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
    // eslint-disable-next-line no-await-in-loop
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

function spawnCommand(command, args, label, envOverrides = {}) {
  const proc = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
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

async function runScenarios(frontendUrl, backendUrl, backendHealthUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript((apiBaseUrl) => {
    window.__API_BASE_URL = apiBaseUrl;
  }, backendUrl);
  const page = await context.newPage();

  try {
    // Scenario 1: backend health endpoint via Playwright request context.
    const healthRes = await context.request.get(backendHealthUrl);
    if (!healthRes.ok()) {
      throw new Error(`Health endpoint did not return 200. Status: ${healthRes.status()}`);
    }

    // Scenario 2: intro -> quick demo -> progress bar reaches 1/13 -> jump to game 8 -> reach game 9.
    await page.goto(`${frontendUrl}/intro`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Quick Demo' }).click();
    await page.waitForURL('**/game/1');
    await page.locator('div').filter({ hasText: /1\s*\/\s*13/ }).first().waitFor({ timeout: 15_000 });

    await page.goto(`${frontendUrl}/game/8`, { waitUntil: 'networkidle' });

    // Handle consent modal for non-demo direct access.
    const consentContinue = page.getByRole('button', { name: 'Continuar con la Evaluación' });
    if (await consentContinue.isVisible().catch(() => false)) {
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      if (count >= 3) {
        await checkboxes.nth(2).check();
      }
      await consentContinue.click();
    }

    await page.getByRole('button', { name: 'Listo, comenzar juego' }).click();
    await page.getByText('Complementary Game 1: Metacognitive Calibration').waitFor({ timeout: 15_000 });
    await page.locator('div').filter({ hasText: /8\s*\/\s*13/ }).first().waitFor({ timeout: 15_000 });

    // Scenario 3: recruiter login -> dashboard.
    await page.goto(`${frontendUrl}/recruiter/login`, { waitUntil: 'networkidle' });
    await page.locator('#email').fill('recruiter@krumm.io');
    await page.locator('#password').fill('demo-password');
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL('**/recruiter/dashboard');
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

async function main() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const frontendPort = await findAvailablePort(FRONTEND_PORT_BASE);
  const backendPort = await findAvailablePort(BACKEND_PORT_BASE);
  const frontendUrl = `http://${HOST}:${frontendPort}`;
  const backendUrl = `http://${HOST}:${backendPort}`;
  const backendHealthUrl = `${backendUrl}/health`;

  const startFrontend = true;
  const startBackend = true;

  console.log(`[e2e] frontend url: ${frontendUrl}`);
  console.log(`[e2e] backend url: ${backendUrl}`);

  const frontendProc = startFrontend
    ? spawnCommand(
      npmCommand,
      ['run', 'dev', '--', '--host', HOST, '--port', String(frontendPort), '--strictPort', '--open', 'false'],
      'frontend',
      { VITE_API_BASE_URL: backendUrl }
    )
    : null;
  const backendProc = startBackend
    ? spawnCommand(npmCommand, ['run', 'dev:server'], 'backend', { PORT: String(backendPort) })
    : null;

  const cleanup = () => {
    if (frontendProc && !frontendProc.killed) frontendProc.kill();
    if (backendProc && !backendProc.killed) backendProc.kill();
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
