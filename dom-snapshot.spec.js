const puppeteer = require('puppeteer');

test('regression testing page dom snapshot', async() => {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();

    await page.goto('https://www.linkit.nl/');

    expect(await page.content()).toMatchSnapshot();

    await page.close();

    await browser.close();
});
