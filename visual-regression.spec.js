const puppeteer = require('puppeteer');
const fs = require('fs');
const looksSame = require('looks-same');
// You can switch to using https://github.com/mapbox/pixelmatch#nodejs
// If you prefer to keep a diff image in your reports

// Inspiration: https://github.com/trentmwillis/devtools-protocol-demos/blob/master/testing-demos/visual-regression.js

const takeScreenshot = async (page, title) => {
  if (!fs.existsSync('./.screenshots')) {
    fs.mkdirSync('./.screenshots');
  }
  const filePath = `./.screenshots/${title}.png`;
  if (fs.existsSync(filePath)) {
    const newFilePath = `./.screenshots/${title}-new.png`;
    await page.screenshot({
      path: newFilePath,
      fullPage: true
    });
    const result = await new Promise(resolve => looksSame(filePath, newFilePath, (err, equal) => resolve(equal)));
    fs.unlinkSync(newFilePath);
    return result;
  } else {
    await page.screenshot({
      path: filePath,
      fullPage: true
    });
    return true;
  }
};

beforeAll(async () => {
  this.browser = await puppeteer.launch();
});

afterAll(async () => {
  await this.browser.close();
});

test('asserts visual regression on the main page', async() => {
  const page = await this.browser.newPage();
  await page.goto('https://pptr.dev');

  expect(await takeScreenshot(page, 'main-page.1')).toBeTruthy();

  await page.close();
}, 20000);
