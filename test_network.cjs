const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', async response => {
    if (response.url().includes('/api/auth/login')) {
      console.log('LOGIN RESPONSE STATUS:', response.status());
      console.log('LOGIN RESPONSE BODY:', await response.text());
    }
    if (response.url().includes('/api/tables/programs')) {
      console.log('PROGRAMS RESPONSE STATUS:', response.status());
      console.log('PROGRAMS RESPONSE BODY:', await response.text());
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
