const puppeteer = require('puppeteer');

// Example on how to use this data: https://michaljanaszek.com/blog/test-website-performance-with-puppeteer
// Timeline viewer: https://chromedevtools.github.io/timeline-viewer/

(async () => {
    const browser = await puppeteer.launch(({
        headless: true,
      }));

    const page = await browser.newPage();

    await page.tracing.start({ path: 'trace.json' });
    await page.goto('https://www.google.com');
    await page.waitForTimeout(2000);
    await page.tracing.stop();

    await page.close();

    await browser.close();
})();
