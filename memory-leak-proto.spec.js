const puppeteer = require('puppeteer');

// Inspiration: https://github.com/trentmwillis/devtools-protocol-demos/blob/master/testing-demos/memory-leak-by-prototype.js

beforeAll(async () => {
  this.browser = await puppeteer.launch();
});

afterAll(async () => {
  await this.browser.close();
});

test('asserts memory leak by prototype on the main page', async() => {
  const page = await this.browser.newPage();
  await page.goto('https://www.linkit.nl');

  // Get a handle to the Map object prototype
  const mapPrototype = await page.evaluateHandle(() => Map.prototype);

  // Query all map instances into an array
  const mapInstances = await page.queryObjects(mapPrototype);

  // Count amount of map objects in heap
  const count = await page.evaluate(maps => maps.length, mapInstances);

  // Idea here is to test object instances on the page
  // where it's expected to be invalidated
  expect(count).toBe(0);

  await page.close();
}, 30000);
