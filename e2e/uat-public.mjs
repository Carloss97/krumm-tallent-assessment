import { chromium } from 'playwright';
import fs from 'fs/promises';

const url = process.argv[2] || process.env.PUBLIC_URL || 'https://clean-maps-bet.loca.lt';
const artifactsDir = './e2e/artifacts';

await fs.mkdir(artifactsDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

page.on('console', (msg) => console.log('PAGE_CONSOLE', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGE_ERROR', err.message));
page.on('response', (res) => { if (res.status() >= 400) console.log('RESP_ERROR', res.status(), res.url()); });

try {
  console.log('UAT_VISIT', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Try locating primary CTA by class then by role
  const startBtnSelector = 'button.lv3-action-start';
  let btnText = null;

  const countByClass = await page.locator(startBtnSelector).count();
  if (countByClass > 0) {
    btnText = await page.locator(startBtnSelector).first().innerText().catch(() => null);
    console.log('FOUND_START_BY_CLASS', btnText);
  } else {
    const roleBtn = page.getByRole('button', { name: /Hacer test ya|Start test now|Start test/i });
    const c = await roleBtn.count();
    if (c > 0) {
      btnText = await roleBtn.first().innerText().catch(() => null);
      console.log('FOUND_START_BY_ROLE', btnText);
    } else {
      console.log('START_BUTTON_NOT_FOUND');
    }
  }

  const langInfo = await page.evaluate(() => ({
    docLang: document.documentElement.lang,
    storedLang: localStorage.getItem('krumm-lang'),
    title: document.title
  }));
  console.log('LANG_INFO', JSON.stringify(langInfo));

  const found = btnText && /Hacer test ya|Start test now|Start test/i.test(btnText);
  if (found) {
    console.log('UAT_OK_BUTTON_VISIBLE');
    try {
      // attempt to click and detect modal/dialog
      const btn = await page.locator(startBtnSelector).first().catch(() => null) || (await page.getByRole('button', { name: /Hacer test ya|Start test now|Start test/i }).first().catch(() => null));
      if (btn) {
        await btn.click({ timeout: 5000 }).catch(() => {});
        console.log('CLICKED_START_BUTTON');
      }
      const dialog = page.locator('div[role="dialog"], .test-access-modal, .quick-modal');
      if ((await dialog.count()) && (await dialog.first().isVisible().catch(() => false))) {
        console.log('UAT_OK_MODAL_VISIBLE');
      } else {
        console.log('UAT_MODAL_NOT_DETECTED');
      }
    } catch (err) {
      console.log('CLICK_FAILED', err && err.message);
    }
    await browser.close();
    process.exit(0);
  }

  console.log('UAT_FAIL_NO_BUTTON');
  await page.screenshot({ path: `${artifactsDir}/uat-fail.png`, fullPage: true }).catch(() => {});
  const html = await page.content();
  await fs.writeFile(`${artifactsDir}/uat-page.html`, html).catch(() => {});
  console.log(`ARTIFACTS=${artifactsDir}/uat-fail.png,${artifactsDir}/uat-page.html`);

  await browser.close();
  process.exit(2);

} catch (e) {
  console.log('UAT_EXCEPTION', e && e.stack);
  await page.screenshot({ path: `${artifactsDir}/uat-exception.png`, fullPage: true }).catch(() => {});
  await browser.close();
  process.exit(3);
}
