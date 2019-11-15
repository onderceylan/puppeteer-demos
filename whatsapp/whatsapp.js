const puppeteer = require('puppeteer');

const groupName = 'Bizimkiler';
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

const getTodaysMessage = () => {
  let date = new Date();
  const isFriday = date.getDay() === 5;

  if (isFriday) {
    return fridayMessage;
  }

  return getRandomElem(messages);
};

(async () => {
  const browser = await puppeteer.launch(({
    headless: true,
    userDataDir: ".tmp",
  }));

  const page = await browser.newPage();

  await page.goto('https://web.whatsapp.com/', {waitUntil: 'networkidle2'});
  await page.waitForSelector('#side input[type=text]');
  await page.type('#side input[type=text]', groupName);
  await page.waitForSelector(`#pane-side span[title="${groupName}"]`, {visible: true});
  await page.click(`span[title="${groupName}"`);
  await page.waitForSelector('footer .copyable-text', {visible: true});
  await page.type('footer .copyable-text', getTodaysMessage());
  await page.keyboard.press('Enter');
  await page.waitFor(1000);
  await page.close();
  await browser.close();
})();
