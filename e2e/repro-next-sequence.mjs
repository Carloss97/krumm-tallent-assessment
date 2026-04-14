#!/usr/bin/env node
import { chromium } from 'playwright';

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:5174';

(async function run(){
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type && msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message + '\n' + err.stack));

  try {
    await page.goto(`${FRONTEND}/demo`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.demo-shell, .demo-activity', { timeout: 20000 });

    // click 'Siguiente' or 'Saltar' multiple times
    for (let i = 0; i < 7; i++) {
      console.log('Iteration', i+1);
      const nextBtn = page.locator('button', { hasText: 'Siguiente' }).first();
      const skipBtn = page.locator('button', { hasText: 'Saltar' }).first();
      if ((await nextBtn.count()) > 0 && await nextBtn.isEnabled()) {
        await nextBtn.click();
      } else if ((await skipBtn.count()) > 0 && await skipBtn.isEnabled()) {
        await skipBtn.click();
      } else {
        // fallback: try sidebar next, or any enabled button
        const sidebarNext = page.locator('.demo-sidebar button', { hasText: 'Siguiente' }).first();
        if ((await sidebarNext.count()) > 0 && await sidebarNext.isEnabled()) {
          await sidebarNext.click();
        } else {
          const anyBtn = page.locator('button:enabled').first();
          if ((await anyBtn.count()) > 0) await anyBtn.click();
        }
      }
      await page.waitForTimeout(600);
    }

    await page.waitForTimeout(1500);

    if (errors.length > 0) {
      console.error('Console/page errors:', errors.slice(0,10));
      process.exitCode = 2;
    } else {
      console.log('No errors detected after sequence');
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
