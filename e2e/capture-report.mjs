#!/usr/bin/env node
import { chromium } from 'playwright';

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:5174';
const DEMO_COUNT = process.env.DEMO_COUNT || 5;

(async function run(){
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type && msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message + '\n' + err.stack));

  try {
    const url = `${FRONTEND}/report?dummy=true&demoCount=${DEMO_COUNT}`;
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#report-main, .report-page, .glass-panel, .report-inline-actions', { timeout: 30000 });

    // Wait for loading spinner/card to go away (if present)
    try {
      await page.waitForSelector('.report-loading-card', { state: 'hidden', timeout: 45000 });
    } catch (e) {
      // continue even if the loading card lingers
    }

    await page.waitForTimeout(1000);
    const path = 'e2e/artifacts/report-screenshot.png';
    await page.screenshot({ path, fullPage: true });
    console.log('Saved screenshot to', path);

    if (errors.length > 0) {
      console.error('Console/page errors:', errors.slice(0,10));
      process.exitCode = 2;
    } else {
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('Capture failed:', err.message || err);
    process.exitCode = 3;
  } finally {
    try { await ctx.close(); } catch {}
    try { await browser.close(); } catch {}
  }
})();
