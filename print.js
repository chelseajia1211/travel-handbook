const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    'file:///Users/chelsea/Desktop/xishuangbanna-handbook/index.html',
    { waitUntil: 'networkidle0', timeout: 30000 }
  );

  await page.pdf({
    path: '/Users/chelsea/Desktop/xishuangbanna-handbook/逐水记.pdf',
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  await browser.close();
  console.log('PDF generated successfully.');
})();
