const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', async response => {
    if (response.url().includes('/api/auth/login')) {
      console.log('LOGIN URL:', response.url(), response.status());
    }
    if (response.url().includes('/api/tables') || response.url().includes('/api/nexora') || response.url().includes('/api/dashboard')) {
       if (response.status() === 403) {
          console.log('403 ERROR FOR:', response.url(), await response.text());
       }
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text && (text.includes('المدير التنفيذي') || text.includes('Admin Login'))) {
      await button.click();
      console.log("Clicked Quick Login");
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2500));
  
  await browser.close();
})();
