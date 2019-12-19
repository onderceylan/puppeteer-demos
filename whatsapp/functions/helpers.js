const getRandomElem = (array) => array[Math.floor(Math.random() * array.length)];

const getRandomEmoji = () => {
  const emojis = ['😘', '😙', '😘', '👋', '🤗'];
  return getRandomElem(emojis);
};

const getTodaysMessage = () => {
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
};

// Checks if session is expired and qr code is shown
// Saves qr code as qr.png image and logs it to console as base64 encoded string
const checkSessionValidityAndSaveQR = async (page) => {
  const qrImgEl = await page.$x('//img[@alt="Scan me!"]');

  if (qrImgEl.length > 0) {
    const img = qrImgEl[0];
    console.log('Saved QR code as qr.png');
    await img.screenshot({ path: 'qr.png' });
    const qrSrc = await img.evaluate((el) => el.src);
    console.log('Logging QR code', qrSrc);
    throw new Error('Session is expired, QR code is logged');
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

const sendMessageToGroup = async (page, message, groupName) => {
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36';
  try {
    // WhatsApp web tries to detect headless chrome so faking the user agent is necessary
    await page.setUserAgent(USER_AGENT);
    await page.goto('https://web.whatsapp.com/', { waitUntil: 'networkidle0', timeout: 0 });

    await forcefullyCaptureSession(page);
    await waitForAppLoad(page);
    await checkSessionValidityAndSaveQR(page);

    await page.waitForSelector('#side input[type=text]');
    await page.type('#side input[type=text]', groupName);
    await page.waitForSelector(`#pane-side span[title="${groupName}"]`, { visible: true });
    await page.click(`span[title="${groupName}"`);
    await page.waitForSelector('footer .copyable-text', { visible: true });
    await page.type('footer .copyable-text', message);
    await page.keyboard.press('Enter');
    await page.waitFor(1000);
    console.log(`Message "${message}" sent to group "${groupName}"`);
  } catch (e) {
    console.error(`There was an error on automated flow`);
    const screen = await page.screenshot({ encoding: 'base64' });
    const dom = await page.content();
    console.log('Logging screenshot', screen);
    console.log('Logging DOM', dom);
    throw e;
  }
};

module.exports = {
  getTodaysMessage,
  sendMessageToGroup,
};
