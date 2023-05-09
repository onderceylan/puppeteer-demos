const puppeteer = require('puppeteer');

(async () => {
  const siteUrl = 'https://pptr.dev';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('response', (resp) => {
      const url = resp.url();
      if (url === siteUrl) {
          const secDetails = resp.securityDetails();
          const ts = Math.floor((new Date()).getTime() / 1000);
          console.log((Math.floor((secDetails.validTo() - ts) / 86400)), 'days to expire');
      }
  });

  await page.goto(siteUrl, { waitUntil: 'networkidle0' });
  await page.close();
  await browser.close();
})();
