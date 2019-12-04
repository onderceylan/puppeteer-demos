const puppeteer = require('puppeteer');

const groupName = 'Bizimkiler';

function getTodaysMessage() {
  const getRandomElem = (array) => array[Math.floor(Math.random() * array.length)];
  const getRandomEmoji = () => {
    const emojis = ['😘', '😙', '😘', '👋', '🤗'];
    return getRandomElem(emojis);
  };
  const messages = [
    `Gunaydın herkese güzel bir gün olsun öpüyorum ${getRandomEmoji()}`,
    `Gunaydın ailem, herkese güzel bir gün olsun öpüyore ${getRandomEmoji()}`,
    `Gunaydın canım ailem, keyifli bir gün olsun öpüyorum ${getRandomEmoji()}`,
  ];
  const fridayMessage = `Gunaydın herkese hayırlı cumalar öpüyorum ${getRandomEmoji()}`;

  let date = new Date();
  let day = date.getDay();
  const isFriday = day === 5;
  const isSaturday = day === 6;
  const isSunday = day === 0;

  // Randomizing the message a bit so my mum doesn't suspect automation
  const randomMessage = getRandomElem(messages);

  if (isFriday) {
    // Because Friday is a sacred day for my parents, message changes a bit
    return fridayMessage;
  } else if (isSaturday) {
    // Because we like to hail the weekend on saturday mornings, yay!
    return randomMessage.replace('gün', 'haftasonu');
  } else if (isSunday) {
    // Because we enjoy stressing it's Sunday :)
    return randomMessage.replace('gün', 'pazar');
  }

  return randomMessage;
}

(async () => {

try {
  const path = require('path');
  const browser = await puppeteer.launch({ headless: true, args: [`--user-data-dir=${path.resolve(__dirname, '.tmp')}`] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36');
  await page.goto('https://web.whatsapp.com/', { waitUntil: 'networkidle0', timeout: 0 });
  // Uncomment below line if you execute the script for the first time, then authenticate via your mobile app using qr on qr.png
  // await page.screenshot({ path: 'qr.png' });
  await page.waitForSelector('#side input[type=text]', { timeout: 15000 });
  await page.type('#side input[type=text]', groupName);
  await page.waitForSelector(`#pane-side span[title="${groupName}"]`, {visible: true});
  await page.click(`span[title="${groupName}"`);
  await page.waitForSelector('footer .copyable-text', {visible: true});
  await page.type('footer .copyable-text', getTodaysMessage());
  await page.keyboard.press('Enter');
  await page.waitFor(1000);
  await page.close();
  await browser.close();

} catch(e) {
  console.error(e);
  process.exit(1);
}
})();
