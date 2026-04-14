#!/usr/bin/env node
import { chromium } from 'playwright';

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:5180';

async function waitForDemo(page) {
  // Wait for the demo shell to be visible
  await page.waitForSelector('section.demo-activity, .demo-shell, h2', { timeout: 20000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${FRONTEND}/demo`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForDemo(page);

    // Ensure the balloon activity is active: wait for title or for the balloon buttons
    await page.waitForSelector('.demo-activity h3, .demo-activity', { timeout: 15000 });

    // Click the first activity if needed
    const title = await page.locator('.demo-activity h3').first().innerText().catch(() => '');
    console.log('Demo activity title:', title);

    // Find expand button inside demo area and click twice
    const expandBtn = page.locator('.demo-activity').getByRole('button').filter({ hasText: /expand|inflar|globo/i }).first();
    const hasExpand = await expandBtn.count();
    let targetBtn = expandBtn;
    if (!hasExpand) {
      // fallback: target the first button in demo-activity
      targetBtn = page.locator('.demo-activity button').first();
    }

    if ((await targetBtn.count()) === 0) {
      throw new Error('No activity button found in demo area');
    }

    console.log('Clicking expand button twice...');
    await targetBtn.click();
    await page.waitForTimeout(200);
    await targetBtn.click();

    // Wait to see if a failure message appears
    await page.waitForTimeout(1600);

    const exploded = await page.locator('text=CRITICAL FAILURE').isVisible().catch(() => false);
    if (exploded) {
      console.error('Balloon exploded after 2 clicks — fix missing');
      process.exitCode = 2;
    } else {
      console.log('Balloon did NOT explode after 2 clicks — OK');
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('E2E check failed:', err.message || err);
    process.exitCode = 3;
  } finally {
    try { await context.close(); } catch {}
    try { await browser.close(); } catch {}
  }
}

run();
