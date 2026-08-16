const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (response.status() === 403 || response.status() === 401) {
      console.log('UNAUTH/FORBIDDEN URL:', response.url(), response.status());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text && (text.includes('المدير التنفيذي') || text.includes('Admin Login'))) {
      await button.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
