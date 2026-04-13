import { chromium } from 'playwright';

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:5180';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('UAT_CLICK_VISIT', url);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const btn = page.locator('button.lv3-action-start');
    const count = await btn.count();
    console.log('BTN_COUNT', count);
    if (count > 0) {
      await btn.first().click().catch(() => {});
      console.log('CLICKED_START_BUTTON');
    } else {
      console.log('NO_START_BUTTON');
    }

    try {
      await page.waitForSelector('div[role="dialog"], .test-access-modal, .quick-modal', { timeout: 5000 });
      console.log('MODAL_FOUND');
    } catch (e) {
      console.log('MODAL_NOT_FOUND');
    }

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('UAT_CLICK_ERROR', err && err.stack);
    await page.screenshot({ path: './e2e/artifacts/uat-click-exception.png', fullPage: true }).catch(() => {});
    await browser.close();
    process.exit(2);
  }
})();
