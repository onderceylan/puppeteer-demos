const puppeteer = require('puppeteer');

(async () => {

    const browser = await puppeteer.launch({
        headless: true,
    });

    const page = await browser.newPage();

    await page.goto(`http://localhost:8002/tensorflow.html`);

    const result = await page.evaluate(() => {
        const img = document.getElementById('img');

        // Load the model.
        return cocoSsd.load().then(model => model.detect(img))
    });

    console.log(result);

    await page.close();

    await browser.close();
})();
