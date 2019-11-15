const puppeteer = require('puppeteer');

(async () => {
  const siteUrl = 'https://www.linkit.nl/';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const protocol = await page.target().createCDPSession();
  await protocol.send('Security.enable');

  protocol.on('Security.securityStateChanged', (state) => {
    console.log(state);
  });

  await page.goto(siteUrl, { waitUntil: 'networkidle0' });
  await page.close();
  await browser.close();
})();



