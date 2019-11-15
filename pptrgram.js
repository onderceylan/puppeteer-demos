const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    // All available filters from cssgram
    const filters = [
        '1977',
        'aden',
        'amaro',
        'brannan',
        'brooklyn',
        'clarendon',
        'gingham',
        'hudson',
        'inkwell',
        'kelvin',
        'lark',
        'lofi',
        'mayfair',
        'moon',
        'nashville',
        'perpetua',
        'reyes',
        'rise',
        'slumber',
        'stinson',
        'toaster',
        'valencia',
        'walden',
        'willow',
        'xpro2'
    ];

    const browser = await puppeteer.launch({
        headless: true,
    });

    const getImageBase64Url = (imagePath) => {
        return `data:image/jpeg;base64,${fs.readFileSync(imagePath, {
            encoding: 'base64',
        })}`;
    };

    await Promise.all(filters.map(async (filter) => {
        const page = await browser.newPage();
        await page.setContent(`
            <style>
                html, body, figure {
                    margin: 0;
                    padding: 0;
                }
                figure {
                    position: relative;
                    display: block;
                }
                span {
                    font-family: Calibri, Helvetica, Arial, sans-serif;
                    font-size: 45px;
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    font-weight: bold;
                    display: block;
                    color: rgba(255, 255, 255, 0.7);
                    text-shadow: 2px 2px 2px #000;
                }
            </style>
            <figure class="${filter}">
                <img src="${getImageBase64Url('./sample.jpg')}">
                <span>@onderceylan</span>
            </figure>
        `, { waitUntil: 'networkidle2' });

        await page.addStyleTag({
            url: 'https://cdnjs.cloudflare.com/ajax/libs/cssgram/0.1.10/cssgram.min.css'
        });

        // Get original image dimensions
        const { width, height } = await page.evaluate(() => {
            return (({naturalWidth: width, naturalHeight: height}) => ({width, height}))(document.querySelector('img'));
        });

        await page.setViewport({ width, height });

        await page.screenshot({
            path: `pptgram/pptrgram-${filter}.jpeg`,
            type: 'jpeg',
            quality: 70,
            fullPage: true,
        });

        await page.close();
    }));

    await browser.close();
})();
