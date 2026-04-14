#!/usr/bin/env node
import { chromium } from 'playwright';

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:5174';

(async function run(){
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type && msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message + '\n' + err.stack));

  try {
    await page.goto(`${FRONTEND}/demo`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.demo-shell, .demo-activity', { timeout: 20000 });
    // Click skip button
    const skip = page.getByRole('button', { name: /Saltar|Skip|Siguiente|Next/i });
    // Try click the explicit 'Saltar' and 'Siguiente' via text search
    const skipBtn = page.locator('button', { hasText: 'Saltar' }).first();
    const nextBtn = page.locator('button', { hasText: 'Siguiente' }).first();

    if ((await skipBtn.count()) > 0) {
      console.log('Clicking Saltar');
      await skipBtn.click();
    } else if ((await nextBtn.count()) > 0) {
      console.log('Clicking Siguiente');
      await nextBtn.click();
    } else {
      // fallback - click second .btn in .demo-controls
      const controls = page.locator('.demo-controls .btn').nth(1);
      if ((await controls.count()) > 0) {
        console.log('Clicking controls[1] fallback');
        await controls.click();
      } else {
        console.log('No skip/next button found');
      }
    }

    // wait a bit
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.error('Console/page errors:', errors.slice(0,10));
      process.exitCode = 2;
    } else {
      console.log('No errors detected after click');
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('E2E repro failed:', err.message);
    process.exitCode = 3;
  } finally {
    try { await ctx.close(); } catch {}
    try { await browser.close(); } catch {}
  }
})();
