const puppeteer = require('puppeteer');

// Inspiration: https://github.com/trentmwillis/devtools-protocol-demos/blob/master/testing-demos/memory-leak-by-heap.js

beforeAll(async () => {
  this.browser = await puppeteer.launch();
});

afterAll(async () => {
  await this.browser.close();
});

test('asserts memory leak by heap on the main page', async() => {
  const page = await this.browser.newPage();
  await page.goto('https://pptr.dev');


  const protocol = await page.target().createCDPSession();
  await protocol.send('HeapProfiler.enable');
  await protocol.send('HeapProfiler.collectGarbage');

  const startMetrics = await page.metrics();

  // Do memory regressions here by interacting with the page
  await protocol.send('Input.synthesizeScrollGesture', {
    x: 100,
    y: 100,
    yDistance: -400,
    repeatCount: 3
  });

  // Or just keep your app open for a certain amoun of time
  await page.waitForTimeout(5000);

  await protocol.send('HeapProfiler.collectGarbage');

  const endMetrics = await page.metrics();

  expect(endMetrics.JSHeapUsedSize < startMetrics.JSHeapUsedSize * 1.1).toBeTruthy();

  await page.close();
}, 30000);
