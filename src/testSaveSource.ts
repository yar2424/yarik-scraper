import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://google.com", {
    // waitUntil: "domcontentloaded",
  });
  // Wait for 5 seconds
  const pageContent = await page.content();
  fs.writeFileSync("test.html", pageContent);
  // Take screenshot
  await browser.close();
})();
