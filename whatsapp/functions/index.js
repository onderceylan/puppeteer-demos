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
 * 1. Execute whatsapp-demo.js with `node whatsapp-demo` in parent dir and manually authenticate yourself via your mobile app, qr.png image will be saved
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
const { getTodaysMessage, sendMessageToGroup } = require('./helpers');
admin.initializeApp();

const USER_FOLDER_NAME = 'chrome-user';
const TEMP_USER_FOLDER_PATH = path.resolve(os.tmpdir(), USER_FOLDER_NAME);
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

async function sendMessage() {
  const todaysMessage = getTodaysMessage();

  // --user-data-dir not as option but as launch arg because https://github.com/puppeteer/puppeteer/issues/921#issuecomment-561054884
  // --no-sandbox because fails otherwise with "Running as root without —-no-sandbox is not supported."
  const browser = await puppeteer.launch({ headless: true, args: [`--user-data-dir=${TEMP_USER_FOLDER_PATH}`, '--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await sendMessageToGroup(page, todaysMessage, GROUP_NAME);
  } finally {
    await page.close();
    await browser.close();
  }

  return todaysMessage;
}

const executeFunction = async () => {

  const [filesInStorage] = await listStorageFiles();
  const userProfileFile = filesInStorage.find(file => file.name.includes(USER_FOLDER_NAME));
  const tempFilePath = await downloadUserFile(userProfileFile.name);

  await unzipUserData(tempFilePath);

  return sendMessage();
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
exports.morningHailOnWeekdays1 = scheduleFnAt('44 7 * * 1');
exports.morningHailOnWeekdays2 = scheduleFnAt('10 8 * * 2');
exports.morningHailOnWeekdays3 = scheduleFnAt('52 7 * * 3');
exports.morningHailOnWeekdays4 = scheduleFnAt('15 8 * * 4');
exports.morningHailOnWeekdays5 = scheduleFnAt('38 8 * * 5');
exports.morningHailOnWeekends1 = scheduleFnAt('44 10 * * 6');
exports.morningHailOnWeekends2 = scheduleFnAt('27 11 * * 0');
