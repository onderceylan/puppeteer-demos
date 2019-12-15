/*
 * WhatsApp Morning Hail!
 * Firebase/Google Cloud function to hail parents on WhatsApp automatically in the morning that is executed daily via scheduler!
 *
 * It keeps your WhatsApp session in Cloud Storage over Chrome's user data directory
 * And sends a message to a WhatsApp group every morning with headless chrome instance using Puppeteer on a cloud function
 *
 * Although I use it personally on my personal cloud environment, I need to warn you to use it at your own risk!
 *
 * Setup
 * 1. Execute whatsapp-demo.js with `node whatsapp-demo` in parent dir and manually authenticate yourself via your mobile app, see whatsapp-demo.js L:35
 * 2. After authentication, your credentials will be saved to .tmp folder. Get into the folder and zip all the contents to a file named chrome-user.zip
 *    !! If you are not able to see .tmp folder, you need to reveal hidden files and folders
 * 3. Upload your chrome-user.zip file to the default bucket on your Cloud Storage
 *    !! Be careful if you decide to change storage.rules, make sure this file is securely stored
 * 4. Enable Cloud Scheduler and Pub/Sub APIs on your project
 *    !! https://cloud.google.com/scheduler/docs/quickstart
 * 5. Configure crontab for scheduler by using an online generator, like https://crontab.guru/ on L:141-145
 * 6. Emulate and deploy your functions with npm scripts emulate & deploy
 *    !! When emulating, set up admin credentials for local emulation https://firebase.google.com/docs/functions/local-emulator#set_up_admin_credentials_optional and modify path on preemulate script
 *    !! To enable emulator and run functions locally https: //firebase.google.com/docs/functions/local-emulator
 * Tweet me @onderceylan if you've any questions!
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const puppeteer = require('puppeteer');
admin.initializeApp();

const USER_FOLDER_NAME = 'chrome-user';
const TEMP_USER_FOLDER_PATH = path.resolve(os.tmpdir(), USER_FOLDER_NAME);
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36';
const GROUP_NAME = 'Bizimkiler';

function listStorageFiles() {
  return admin.storage().bucket().getFiles();
}

async function downloadUserFile(filePath) {
  const tempFilePath = path.join(os.tmpdir(), filePath);
  const bucket = admin.storage().bucket();
  await bucket.file(filePath).download({ destination: tempFilePath });
  return tempFilePath;
}

function unzipUserData(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath).pipe(unzipper.Extract({ path: TEMP_USER_FOLDER_PATH })).on('close', resolve).on('error', reject);
  });
}

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

async function sendMessage() {
  const todaysMessage = getTodaysMessage();

  // --user-data-dir not as option but as launch arg because https://github.com/puppeteer/puppeteer/issues/921#issuecomment-561054884
  // --no-sandbox because fails otherwise with "Running as root without —-no-sandbox is not supported."
  const browser = await puppeteer.launch({ headless: true, args: [`--user-data-dir=${TEMP_USER_FOLDER_PATH}`, '--no-sandbox'] });
  const page = await browser.newPage();
  // Whatsapp web tries to detect headless chrome so faking the user agent is necessary
  await page.setUserAgent(USER_AGENT);
  await page.goto('https://web.whatsapp.com/', { waitUntil: 'networkidle0', timeout: 0 });

  // WhatsApp might show "Use here" prompt if you keep your session elsewhere
  page
    .waitForXPath('//div[@role="button"][text()="Use Here"]', { timeout: 0 })
    .then(async (button) => {
      console.log(`"Use here" button is shown`);
      console.log(`Clicking`);
      return await button.click();
    }).catch();

  // Session might be expired
  page
    .waitForXPath('//div[@role="button"][text()="Click to reload QR code"]', { timeout: 0 })
    .then(async (button) => {
      console.log(`"Click to reload QR" prompt is shown`);
      console.log(`Clicking`);
      return await button.click();
    }).catch();

  // Log the QR if session is expired
  page
    .waitForXPath('//img[@alt="Scan me!"]', { timeout: 0 })
    .then(async (img) => {
      console.log('QR prompt is shown');
      const qrSrc = await img.getProperty('src');
      console.log('Logging QR code', qrSrc);
      return qrSrc;
    }).catch();

  try {
    await page.waitForSelector('#side input[type=text]');
    await page.type('#side input[type=text]', GROUP_NAME);
    await page.waitForSelector(`#pane-side span[title="${GROUP_NAME}"]`, { visible: true });
    await page.click(`span[title="${GROUP_NAME}"`);
    await page.waitForSelector('footer .copyable-text', { visible: true });
    await page.type('footer .copyable-text', todaysMessage);
    await page.keyboard.press('Enter');
    await page.waitFor(1000);
    await page.close();
    await browser.close();
  } catch (e) {
    console.error(`There was an error on automated flow`);
    const screen = await page.screenshot({ encoding: 'base64' });
    const dom = await page.content();
    console.log('Logging screenshot', screen);
    console.log('Logging DOM', dom);
    throw e;
  }

  return todaysMessage;
}

const executeFunction = async () => {

  const [filesInStorage] = await listStorageFiles();
  const userProfileFile = filesInStorage.find(file => file.name.includes(USER_FOLDER_NAME));
  const tempFilePath = await downloadUserFile(userProfileFile.name);

  await unzipUserData(tempFilePath);
  const sentMessage = await sendMessage();

  console.log(`Message "${sentMessage}" sent to group "${GROUP_NAME}"`);
  return sentMessage;
};

const scheduleFnAt = (crontab) => functions
  // Because function exceeds memory limits when memory is lower than 1GB
  .runWith({ timeoutSeconds: 500, memory: '1GB' })
  .region('europe-west1')
  .pubsub
    .schedule(crontab)
    .timeZone('Europe/Amsterdam')
    .onRun(executeFunction);

// TODO: find a way to programmatically randomize crontab on Google Cloud scheduler
// Schedule the function execution at 07:30 on every day-of-week from Monday through Friday
exports.morningHailOnWeekdays1 = scheduleFnAt('44 7 * * 1');
exports.morningHailOnWeekdays2 = scheduleFnAt('10 8 * * 2');
exports.morningHailOnWeekdays3 = scheduleFnAt('52 7 * * 3');
exports.morningHailOnWeekdays4 = scheduleFnAt('15 8 * * 4');
exports.morningHailOnWeekdays5 = scheduleFnAt('38 8 * * 5');
// Schedule the function execution at 10:30 on Sunday and Saturday
// Because we've a slightly different routine on weekends
exports.morningHailOnWeekends1 = scheduleFnAt('44 10 * * 6');
exports.morningHailOnWeekends2 = scheduleFnAt('27 11 * * 0');
