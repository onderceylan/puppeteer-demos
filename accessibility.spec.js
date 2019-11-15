const puppeteer = require('puppeteer');

// Inspiration: https://github.com/trentmwillis/devtools-protocol-demos/blob/master/testing-demos/accessibility.js

beforeAll(async () => {
  this.browser = await puppeteer.launch();
});

afterAll(async () => {
  await this.browser.close();
});

test('app is accessible and has no accessibility violations', async() => {
  const page = await this.browser.newPage();
  await page.goto('https://frontmania.com');

  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/3.3.2/axe.min.js' });
  const results = await page.evaluate(() => axe.run(document));

  if (results.violations.length > 0) {
    console.log(`Found ${results.violations.length} accessibility violations`);
    console.log(results.violations);
  }
  expect(results.violations.length).toBe(0);

  await page.close();
});
