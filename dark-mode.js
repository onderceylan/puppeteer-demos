const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.goto('https://googlechromelabs.github.io/dark-mode-toggle/demo/index.html');
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.waitFor(200);
  await page.screenshot({ path: 'light.jpg', type: 'jpeg', omitBackground: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.waitFor(200);
  await page.screenshot({ path: 'dark.jpg', type: 'jpeg', omitBackground: true });
  await browser.close();
})();
