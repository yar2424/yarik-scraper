import type { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";

import { Stock } from "../types.js";
import { BaseScrapper } from "./baseScrapper.js";
import { RetryScrapperRun } from "./utils.js";
import { config } from "../config.js";

export interface IItemTPlus extends IItem {
  price_tp?: string;
  stock_tp?: Stock;
  last_updated_tp?: string;
}

const scrapperName = "TPlus";

export class ScrapperTPlus extends BaseScrapper<IItemTPlus> {
  constructor(
    public items: IItemTPlus[],
    public scrappingStartedAt: string = ""
  ) {
    super(
      items,
      "",
      scrapperName,
      "https://tplus.market",
      "price_tp",
      "stock_tp",
      "last_updated_tp",
      "ssilkatekhno33"
    );
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
    await page.type(usernameSelector, config.shopsCredentials.usernameTPlus);

    const passwordSelector =
      "xpath//html/body/div[1]/div/div/div[3]/div/div/div[2]/div/div/form/div[3]/div/div/div/div[2]/input";
    await page.waitForSelector(passwordSelector);
    await page.type(passwordSelector, config.shopsCredentials.passwordTPlus);

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

    try {
      const inStock = await this.isInStock(page);

      const price = inStock ? await this.getPriceFromPage(page) : "-1";

      item.stock_tp = inStock ? "В наличии" : "Нет в наличии";
      item.price_tp = price;
      item.last_updated_tp = this.scrappingStartedAt;
    } catch (e) {
      console.log(`WARNING Failed to scrap item due to error: ${e}`);
      item.stock_tp = "failed to scrap";
      item.price_tp = "failed to scrap";
      item.last_updated_tp = this.scrappingStartedAt;
    }

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

  @RetryScrapperRun(3, scrapperName)
  async runScrapperWrapper(): Promise<IItemTPlus[]> {
    return await this.runScrapper();
  }
}
