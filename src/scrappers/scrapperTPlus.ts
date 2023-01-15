// import puppeteer from "puppeteer-extra";
import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";

import { executablePath } from "puppeteer";
import { RestoreRequestType } from "@aws-sdk/client-s3";
import { getBrowser, Retry } from "./utils.js";

export interface IItemTPlus extends IItem {
  price_tp?: string;
  stock_tp?: "В наличии" | "Нет в наличии";
  last_updated_tp?: string;
}

export class ScrapperTPlus {
  constructor(
    public items: IItemTPlus[],
    public scrappingStartedAt: string = ""
  ) {}

  getItemsWithValidUrls(): IItemTPlus[] {
    return this.items.filter((item) =>
      item.ssilkatekhno33.startsWith("https://tplus.market")
    );
  }

  @Retry(3, "TPlus")
  async runScrapper() {
    const itemsToScrap = this.getItemsWithValidUrls();

    console.log(
      `Started TPlus scrapper. Will scrap ${itemsToScrap.length} items.`
    );
    this.scrappingStartedAt = new Date().toLocaleString("en-GB", {
      timeZone: "CET",
    });

    const browser = await getBrowser();
    const basePage = await browser.newPage();
    await basePage.setDefaultNavigationTimeout(0);

    await this.logIn(basePage);

    //time it
    let start = Date.now();

    let itemsWithScrappedData: IItemTPlus[] = [];

    for (let item of itemsToScrap) {
      itemsWithScrappedData.push(await this.scrapItem(basePage, item));
    }

    await browser.close();

    let end = Date.now();
    let elapsedMilliseconds = end - start;
    console.log(
      `Finished TPlus scrapping. Scrapped ${
        itemsToScrap.length
      } items in ${Math.floor(elapsedMilliseconds / 60000)} minutes.`
    );

    return itemsWithScrappedData;
  }

  async logIn(page: Page) {
    console.log("Logging in");

    const logInUrl = "https://tplus.market/";

    await page.goto(logInUrl);
    const logInPopUpSelector =
      "xpath//html/body/div/div/div/div[1]/header/div/div/div[2]/div/span[1]";
    const logInPopUpElement = await page.waitForSelector(logInPopUpSelector);
    if (logInPopUpElement === null) {
      console.log("Failed to log in");
      throw new Error("Failed to log in");
    }
    await logInPopUpElement.click();

    const usernameSelector =
      "xpath//html/body/div[1]/div/div/div[3]/div/div/div[2]/div/div/form/div[2]/div/div/div/div[2]/input";
    await page.waitForSelector(usernameSelector);
    await page.type(usernameSelector, "r.konstantinov.00@gmail.com");

    const passwordSelector =
      "xpath//html/body/div[1]/div/div/div[3]/div/div/div[2]/div/div/form/div[3]/div/div/div/div[2]/input";
    await page.waitForSelector(passwordSelector);
    await page.type(passwordSelector, "Konstanta2505");

    const logInButtonSelector =
      "xpath//html/body/div[1]/div/div/div[3]/div/div/div[2]/div/div/form/div[5]/button";
    await page.waitForSelector(logInButtonSelector);
    await page.click(logInButtonSelector);

    await new Promise((r) => setTimeout(r, 2000));

    console.log("Logged in");
  }

  async scrapItem(page: Page, item: IItemTPlus) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.ssilkatekhno33}'`
    );

    await page.goto(item.ssilkatekhno33);

    const inStock = await this.isInStock(page);

    const price = inStock ? await this.getPriceFromPage(page) : "-1";

    item.stock_tp = inStock ? "В наличии" : "Нет в наличии";
    item.price_tp = price;
    item.last_updated_tp = this.scrappingStartedAt;

    console.log(`Finished scrapping item '${item["g:mpn"]}'`);

    return item;
  }

  async isInStock(page: Page): Promise<boolean> {
    const button = await page.waitForSelector(
      "xpath//html/body/div/div/div/div[1]/main/div/div/div/div[3]/div[2]/div/div[2]/div/div[3]/div/button[1]/span/span"
    );
    if (button === null) {
      console.log("WARNING Failed to scrap stock.");
      return false;
    }
    const buttonText = await button.evaluate((el) => el.textContent);
    return buttonText === "Повідомити" ? false : true;
  }

  async getPriceFromPage(page: Page) {
    const el = await page.waitForSelector(
      "xpath//html/body/div/div/div/div[1]/main/div/div/div/div[3]/div[2]/div/div[2]/div/div[1]/div[1]/div/span[3]"
    );
    if (el === null) {
      console.log("WARNING Failed to scrap a price.");
      return "-1";
    }
    const value = await el.evaluate((el) => el.textContent);
    if (value === null) {
      console.log("WARNING Failed to scrap a price.");
      return "-1";
    }
    const price = value.replace(/[^0-9,]/g, "");
    return price;
  }
}
