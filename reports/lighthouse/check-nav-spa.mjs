import { chromium } from 'playwright';

const URL = process.argv[2] || process.env.URL || 'http://127.0.0.1:5173/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE_CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR', err.message));
  page.on('requestfailed', req => console.log('REQ_FAILED', req.url(), req.failure() ? req.failure().errorText : ''));

  try {
    console.log('GOTO', URL);
    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
    // wait for #root to be present
    await page.waitForSelector('#root', { timeout: 5000 });
    await page.waitForTimeout(300);

    const rootHtml = await page.$eval('#root', el => el.innerHTML.slice(0, 2000)).catch(() => null);
    console.log('ROOT_INITIAL_LENGTH', rootHtml ? rootHtml.length : 0);

    // try to find portal or anchor to /postulantes
    const sel = 'a[href="/postulantes"], a[href="./postulantes"], a[href="postulantes"], button[data-route="/postulantes"], a[data-route="/postulantes"], button[data-href="/postulantes"]';
    const anchor = await page.$(sel);
    if (!anchor) {
      console.log('NO_ANCHOR_FOUND');
      await browser.close();
      process.exit(0);
    }

    console.log('CLICKING_ANCHOR');
    await anchor.click();
    await page.waitForTimeout(600);
    await page.waitForLoadState('networkidle').catch(() => {});

    const afterClick = await page.$eval('#root', el => el.innerHTML.slice(0, 2000)).catch(() => null);
    console.log('AFTER_CLICK_LENGTH', afterClick ? afterClick.length : 0);

    console.log('GO_BACK');
    await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(400);
    const afterBack = await page.$eval('#root', el => el.innerHTML.slice(0, 2000)).catch(() => null);
    console.log('AFTER_BACK_LENGTH', afterBack ? afterBack.length : 0);

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERR', err);
    await browser.close();
    process.exit(2);
  }
})();
