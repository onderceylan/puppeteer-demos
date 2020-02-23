const puppeteer = require('puppeteer');
const { getTodaysMessage, sendMessageToGroup } = require('./functions/helpers');

(async () => {

try {
  const path = require('path');
  const browser = await puppeteer.launch({ headless: false, args: [`--user-data-dir=${path.resolve(__dirname, '.tmp')}`] });
  const page = await browser.newPage();

  try {
    await sendMessageToGroup(page, getTodaysMessage(), 'Bizimkiler', true);
  } finally {
    await page.close();
    await browser.close();
  }
} catch(e) {
  console.error(e);
  process.exit(1);
}
})();
