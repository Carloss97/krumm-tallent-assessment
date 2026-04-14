#!/usr/bin/env node
import { chromium } from 'playwright';

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:5180';

async function waitForDemo(page) {
  await page.waitForSelector('section.demo-activity, .demo-shell, h2', { timeout: 20000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type && msg.type() === 'error') errors.push(msg.text());
  });

  try {
    await page.goto(`${FRONTEND}/demo`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForDemo(page);

    const items = page.locator('.demo-sidebar ol li');
    const count = await items.count();
    console.log('Found activities:', count);
    if (count === 0) throw new Error('No activities found in sidebar');

    for (let i = 0; i < count; i++) {
      await items.nth(i).click();
      await page.waitForSelector('.demo-activity h3', { timeout: 15000 });
      const title = await page.locator('.demo-activity h3').innerText().catch(() => '');
      console.log(`Activity ${i + 1}/${count}: "${title}"`);

      await page.waitForTimeout(800);

      if (errors.length > 0) {
        console.error('Console errors detected:', errors.slice(0, 5));
        process.exitCode = 2;
        break;
      }

      const btn = page.locator('.demo-activity button').first();
      if ((await btn.count()) > 0) {
        try { await btn.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(300); } catch (e) {}
      }
    }

    if (process.exitCode !== 2) {
      console.log('All activities loaded without console errors.');
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
