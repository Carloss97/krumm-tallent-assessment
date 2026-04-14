import { chromium } from 'playwright';

const URL = process.env.URL || 'http://127.0.0.1:5173';

async function waitForServer(page, url, tries = 40, delay = 500) {
  for (let i = 0; i < tries; i++) {
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 5000 });
      if (resp && (resp.ok() || resp.status() < 400)) return;
    } catch (e) {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error('Server did not respond in time');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    console.log('Waiting for preview server...', URL);
    await waitForServer(page, URL, 60, 500);

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'reports/lighthouse/mobile.png', fullPage: true });
    console.log('Saved reports/lighthouse/mobile.png');

    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'reports/lighthouse/desktop.png', fullPage: true });
    console.log('Saved reports/lighthouse/desktop.png');

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Screenshot script failed:', err);
    await browser.close();
    process.exit(2);
  }
})();
