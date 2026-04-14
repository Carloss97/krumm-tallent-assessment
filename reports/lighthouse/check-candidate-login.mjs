import { chromium } from 'playwright';

const URL = process.env.URL || 'http://127.0.0.1:5173/candidate/login';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(URL, { waitUntil: 'networkidle' });
    // wait for either candidate-login or postulantes-login up to 5s
    const cand = await page.$('.candidate-login');
    const post = await page.$('.postulantes-login');
    if (cand) {
      const html = await page.$eval('.candidate-login', el => el.outerHTML.slice(0, 2000));
      console.log('FOUND_CAND');
      console.log(html);
    } else if (post) {
      const html = await page.$eval('.postulantes-login', el => el.outerHTML.slice(0, 2000));
      console.log('FOUND_POSTULANTES');
      console.log(html);
    } else {
      const root = await page.$('#root');
      const inner = root ? await page.$eval('#root', el => el.innerHTML.slice(0, 2000)) : '';
      console.log('NOT_FOUND');
      console.log(inner || '(empty)');
    }
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERR', err);
    await browser.close();
    process.exit(2);
  }
})();
