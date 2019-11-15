const puppeteer = require('puppeteer');
const pti = require('puppeteer-to-istanbul');

// Inspiration: https://github.com/trentmwillis/devtools-protocol-demos/blob/master/testing-demos/code-coverage.js

(async () => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.coverage.startJSCoverage();

  await page.goto('https://www.linkit.nl/');

  const jsCoverage = await page.coverage.stopJSCoverage();
  pti.write(jsCoverage);

  await page.close();

  await browser.close();
})();
