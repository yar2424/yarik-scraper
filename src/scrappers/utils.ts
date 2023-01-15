import puppeteer from "puppeteer";
// import { executablePath } from "puppeteer";
// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { Shop } from "../outputXmlHelper.js";

export function Retry(maxAttempts: number, scrapperName: Shop) {
  return function (
    target: Object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalFunction = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      let attempt = 1;
      while (true) {
        if (attempt === 1) {
          console.log(
            `Trying to run ${scrapperName} scrapper for the ${attempt} time.`
          );
        } else if (attempt <= maxAttempts) {
          console.log(
            `WARNING Trying to run ${scrapperName} scrapper for the ${attempt} time.`
          );
        } else {
          console.log(
            `CRITICAL Failed to run ${scrapperName} scrapper. Tried ${
              attempt - 1
            } times.`
          );
          throw new Error(`Failed to run ${scrapperName} scrapper`);
        }
        try {
          const result = await originalFunction.apply(this, args);
          return result;
        } catch (error) {
          console.log(
            `WARNING Failed to run ${scrapperName} scrapper with following error ${error}`
          );
          attempt++;
        }
      }
    };
    return descriptor;
  };
}

export async function getBrowser() {
  // puppeteer.use(StealthPlugin());
  return await puppeteer.launch({
    // headless: false,
    // defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--deterministic-fetch",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
      "--single-process",
      // "--window-size=1920,1080",
    ],
    // executablePath: executablePath(),
  });
}
