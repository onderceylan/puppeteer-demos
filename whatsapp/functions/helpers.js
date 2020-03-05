const admin = require('firebase-admin');
const unzipper = require('unzipper');
const fs = require('fs');
const os = require('os');
const path = require('path');
const USER_FOLDER_NAME = 'chrome-user';
const TEMP_USER_FOLDER_PATH = path.resolve(os.tmpdir(), USER_FOLDER_NAME);

admin.initializeApp();

const listStorageFiles = () =>  {
  return admin.storage().bucket().getFiles();
};

const downloadUserFile = async (filePath) => {
  const tempFilePath = path.join(os.tmpdir(), filePath);
  const bucket = admin.storage().bucket();
  await bucket.file(filePath).download({ destination: tempFilePath });
  return tempFilePath;
};

const saveFileToStorage = (filePath, data, options = null) => {
  // const tempFilePath = path.join(os.tmpdir(), filePath);
  const bucket = admin.storage().bucket();
  return bucket.file(filePath).save(data, options);
};

const unzipUserData = async (filePath) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath).pipe(unzipper.Extract({ path: TEMP_USER_FOLDER_PATH })).on('close', resolve).on('error', reject);
  });
};

const getRandomElem = (array) => array[Math.floor(Math.random() * array.length)];

const getRandomEmoji = () => {
  const emojis = ['😘', '😙', '👋', '🤗', '🥰', '🤓', '🤩'];
  return getRandomElem(emojis);
};

const getTodaysMessage = () => {
  const awesomeWishes = ['güzel', 'şahane', 'keyifli', 'huzurlu', 'harika'];
  const weekendWishes = [ ...awesomeWishes, 'eğlenceli', 'bol dinlenmeli', 'bol gezmeli'];
  const weekDayWishes = [ ...awesomeWishes, 'bereketli', 'başarılı', 'verimli', 'sağlıklı'];
  const kisses = ['öpüyorum', 'öpüldünüz', 'öpüyore', 'öptüm'];
  const hails = ['Gunaydın', 'Gününüz aydın', 'Günaydınlar'];
  const address = ['sevgili ailem', 'canım ailem', 'ceylanos', 'canlar'];
  const who = ['', ' herkese'];
  const comma = ['', ','];

  let date = new Date();
  let day = date.getDay();

  // Randomizing the message a bit so my mom doesn't suspect automation
  const randomMessage = `${getRandomElem(hails)} ${getRandomElem(address)}${getRandomElem(comma)}${getRandomElem(who)} :wish: bir gün olsun ${getRandomElem(kisses)} ${getRandomEmoji()}`;

  switch (day) {
    case 5:
      // Because Friday is a sacred day for my parents, message changes a bit
      return randomMessage.replace(':wish: bir gün olsun', 'hayırlı cumalar');
    case 6:
      // Because we like to hail the weekend on saturday mornings, yay!
      return randomMessage.replace(':wish:', getRandomElem(weekendWishes)).replace('gün', 'haftasonu');
    case 0:
      // Because we enjoy stressing it's Sunday :)
      return randomMessage.replace(':wish:', getRandomElem(weekendWishes)).replace('gün', 'pazar');
    case 1:
      // Because we enjoy stressing it's the week start
      return randomMessage.replace(':wish:', getRandomElem(weekDayWishes)).replace('gün', 'hafta');
    default:
      return randomMessage.replace(':wish:', getRandomElem(weekDayWishes));
  }
};

// Checks if session is expired and qr code is shown
// Saves qr code as qr.png image and logs it to console as base64 encoded string
const checkSessionValidityAndSaveQR = async (page) => {
  const qrImgEl = await page.$x('//canvas[@aria-label="Scan me!"]');

  if (qrImgEl.length > 0) {
    const img = qrImgEl[0];
    try {
      await img.screenshot({ path: 'qr.png' });
      console.log('Saved QR code as qr.png');
    } catch (e) {
      console.log(`Won't save the QR code, authenticate again`);
    }
    throw new Error('Session is expired, need to authenticate again');
  }
};

// Forcefully capture the session when there's a session conflict, aka 'Use Here' prompt
const forcefullyCaptureSession = async (page) => {
  await page.exposeFunction('onDomUpdate', async (innerText) => {
    if (innerText.toLowerCase().includes('use here')) {
      console.log(`"Use here" button is shown`);
      const useHereBtn = await page.$x('//div[@role="button"][text()="Use Here"]');
      if (useHereBtn.length > 0) {
        console.log(`Clicking`);
        await useHereBtn[0].click();
      }
    }
  });

  await page.evaluate(() => {
    const observer = new MutationObserver((mutations) => {
      for(let mutation of mutations) {
        if(mutation.addedNodes.length) {
          onDomUpdate(mutation.addedNodes[0].innerText);
        }
      }
    });
    observer.observe(document.querySelector("body"), { attributes: false, childList: true, subtree: true });
  });
};

const waitForAppLoad = async (page) => {
  // WhatsApp has it's own loading mechanism detached from native page load events
  await page.waitForSelector('#startup', { hidden: true });
  await page.waitFor(1000);
};

const sendMessageToGroup = async (page, message, groupName, dryRun = false) => {
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36';
  try {
    // WhatsApp web tries to detect headless chrome so faking the user agent is necessary
    await page.setUserAgent(USER_AGENT);
    await page.goto('https://web.whatsapp.com/', { waitUntil: 'networkidle0', timeout: 0 });

    await forcefullyCaptureSession(page);
    await waitForAppLoad(page);
    await checkSessionValidityAndSaveQR(page);

    await page.waitForSelector('#side div[contenteditable="true"]');
    await page.type('#side div[contenteditable="true"]', groupName);
    await page.waitForSelector(`#pane-side span[title="${groupName}"]`, { visible: true });
    await page.click(`span[title="${groupName}"`);
    await page.waitForSelector('footer .copyable-text', { visible: true });
    await page.type('footer .copyable-text', message);
    if (dryRun === false) {
      await page.keyboard.press('Enter');
    }
    await page.waitFor(1000);
    console.log(`Message "${message}" sent to group "${groupName}"`);
  } catch (e) {
    console.error(`There was an error on automated flow`);
    const screen = await page.screenshot({ fullPage: true });
    const dom = await page.content();
    await saveFileToStorage('screen.png', screen, { contentType: 'image/png' });
    await saveFileToStorage('dom.html', dom, { contentType: 'text/html' });
    console.log('Saved screenshot to the storage');
    console.log('Saved DOM to the storage');
    throw e;
  }
};

module.exports = {
  getTodaysMessage,
  sendMessageToGroup,
  listStorageFiles,
  downloadUserFile,
  saveFileToStorage,
  unzipUserData,
  USER_FOLDER_NAME,
  TEMP_USER_FOLDER_PATH
};
