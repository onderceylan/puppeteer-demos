/**
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author ebidel@ (Eric Bidelman)
 */

/**
 * Takes a screenshot of the latest tweet in a user's timeline and creates a
 * PDF of it. Shows how to use Puppeteer to:
 *
 *   1. screenshot a DOM element
 *   2. craft an HTML page on-the-fly
 *   3. produce an image of the element and PDF of the page with the image embedded
 *
 * Usage:
 *   node element-to-pdf.js
 *   USERNAME=ChromiumDev node element-to-pdf.js
 *
 *   --searchable makes "find in page" work:
 *   node element-to-pdf.js --searchable
 *
 * Output:
 *   tweet.png and tweet.pdf
 */

// Inspiration: https://github.com/GoogleChromeLabs/puppeteer-examples/blob/master/element-to-pdf.js

const puppeteer = require('puppeteer');

const username = process.env.USERNAME || 'onderceylan';
const searchable = process.argv.includes('--searchable');

(async() => {

const browser = await puppeteer.launch();

const page = await browser.newPage();
await page.setViewport({width: 1200, height: 1000, deviceScaleFactor: 2});
await page.goto(`https://twitter.com/${username}/status/1272513229617496064`);

await page.waitForSelector('article', {visible: true});

const overlay = await page.$('article');
const screenshot = await overlay.screenshot({path: 'tweet.png'});

await page.setContent(`
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        html, body {
          height: 100vh;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #fafafa;
        }
        img {
          max-width: 60%;
          box-shadow: 3px 3px 6px #eee;
          border-radius: 6px;
        }
      </style>
    </head>
    <body>
      <img src="data:img/png;base64,${screenshot.toString('base64')}">
    </body>
  </html>
`);

await page.pdf({path: 'tweet.pdf', printBackground: true});
await browser.close();
})();
