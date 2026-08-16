const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
  });
  page.on('pageerror', error => console.log('PAGE EXCEPTION:', error.message));

  console.log('Navigating...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  console.log('Clicking Quick Admin Login button...');
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text && (text.includes('المدير التنفيذي') || text.includes('Admin Login'))) {
      await button.click();
      console.log('Clicked login button.');
      break;
    }
  }

  await new Promise(r => setTimeout(r, 3000));
  console.log('Waited 3s after login. Capturing errors if any...');
  
  await browser.close();
})();
