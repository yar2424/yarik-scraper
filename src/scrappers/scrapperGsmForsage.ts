import { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";
import { Stock } from "../types.js";
import { BaseScrapper } from "./baseScrapper.js";
import { RetryScrapperRun } from "./utils.js";
import { config } from "../config.js";

export interface IItemGsmForsage extends IItem {
  price_forsage?: string;
  stock_forsage?: Stock;
  last_updated_forsage?: string;
}

const scrapperName = "GsmForsage";

export class ScrapperGsmForsage extends BaseScrapper<IItemGsmForsage> {
  constructor(
    public items: IItemGsmForsage[],
    public scrappingStartedAt: string = ""
  ) {
    super(
      items,
      "",
      scrapperName,
      "https://gsm-forsage.com.ua/",
      "price_forsage",
      "stock_forsage",
      "last_updated_forsage",
      "ssilkaGsmForsage"
    );
  }

  async logIn(page: Page) {
    console.log("Logging in");

    const logInUrl = "https://gsm-forsage.com.ua/";

    await page.goto(logInUrl);
    const logInPopUpSelector =
      "xpath//html/body/div[2]/header/div[2]/div[4]/span[1]/a";

    const logInPopUpElement = await page.waitForSelector(logInPopUpSelector);
    if (logInPopUpElement === null) {
      console.log("Failed to log in");
      throw new Error("Failed to log in");
    }
    await new Promise((res) => setTimeout(res, 3000));
    await logInPopUpElement.click();

    const usernameSelector =
      "xpath//html/body/div[2]/div/div[1]/div/div[2]/div[2]/div[2]/form/fieldset/div[1]/div/input";
    const loginInput = await page.waitForSelector(usernameSelector);
    if (loginInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get username element.");
      throw new Error("Failed to log in");
    }
    await loginInput.type(config.shopsCredentials.usernameGsmForsage);

    const passwordSelector =
      "xpath//html/body/div[2]/div/div[1]/div/div[2]/div[2]/div[2]/form/fieldset/div[2]/div/input";
    const passwordInput = await page.waitForSelector(passwordSelector);
    if (passwordInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get password element.");
      throw new Error("Failed to log in");
    }
    await passwordInput.type(config.shopsCredentials.passwordGsmForsage);

    const logInButtonSelector =
      "xpath//html/body/div[2]/div/div[1]/div/div[2]/div[2]/div[2]/form/fieldset/div[3]/div[1]/button";
    const logInButton = await page.waitForSelector(logInButtonSelector);
    if (logInButton === null) {
      console.log("CRITICAL Failed to log in. Failed to get log in button.");
      throw new Error("Failed to log in");
    }
    await logInButton.click();

    await new Promise((res) => setTimeout(res, 3000));

    const testSelector =
      "xpath//html/body/div[2]/header/div[2]/div[4]/span[2]/div/ul/li[2]/a";
    const testElement = await page.waitForSelector(testSelector);
    if (testElement === null) {
      console.log(
        "CRITICAL Failed to log in. Failed to get test element after log in."
      );
      throw new Error("Failed to log in");
    }
    const checkText = await testElement.evaluate((el) => el.textContent);
    if (checkText !== "Вийти") {
      console.log(
        "CRITICAL Failed to log in. Failed to get successfull log in check."
      );
      throw new Error("Failed to log in");
    }

    console.log("Logged in");
  }

  async scrapItem(page: Page, item: IItemGsmForsage) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.ssilkaGsmForsage}'`
    );

    await page.goto(item.ssilkaGsmForsage);

    try {
      const inStock = await this.isInStock(page);

      const price = inStock ? await this.getPriceFromPage(page) : "-1";

      item.stock_forsage = inStock ? "В наличии" : "Нет в наличии";
      item.price_forsage = price;
      item.last_updated_forsage = this.scrappingStartedAt;
    } catch (e) {
      console.log(`WARNING Failed to scrap item due to error: ${e}`);
      item.stock_forsage = "failed to scrap";
      item.price_forsage = "failed to scrap";
      item.last_updated_forsage = this.scrappingStartedAt;
    }

    console.log(`Finished scrapping item '${item["g:mpn"]}'`);

    return item;
  }

  async isInStock(page: Page) {
    const stockSelector = await page.waitForSelector(
      "xpath//html/body/div[2]/main/div[2]/div[1]/div[2]/div[3]"
    );
    const stockValue = await stockSelector?.evaluate((el) =>
      el.getAttribute("class")
    );

    let isInStock;
    if (stockValue?.includes("alert")) {
      isInStock = false;
    } else if (stockValue?.includes("inventory-stocks")) {
      isInStock = true;
    } else {
      console.log("CRITICAL Failed to scrap stock");
      isInStock = false;
    }

    return isInStock;
  }

  async getPriceFromPage(page: Page) {
    const el = await page.waitForSelector(
      "xpath//html/body/div[2]/main/div[2]/div[1]/div[3]/div[1]/div/span[2]/span[1]/span[2]/span"
    );
    if (el === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const srcTxt = await el.evaluate((el) => el.textContent);
    if (srcTxt === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    let price = srcTxt.replace(/[^0-9]/g, "");
    price = price.slice(0, -2) + "," + price.slice(-2);
    return price;
  }

  @RetryScrapperRun(3, scrapperName)
  async runScrapperWrapper(): Promise<IItemGsmForsage[]> {
    return await this.runScrapper();
  }
}
