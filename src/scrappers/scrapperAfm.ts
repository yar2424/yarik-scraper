import { Page } from "puppeteer";
import { config } from "../config.js";
import { IItem } from "../crmXmlHelper.js";
import { Stock } from "../types.js";
import { BaseScrapper } from "./baseScrapper.js";
import { RetryScrapperRun } from "./utils.js";

export interface IItemAfm extends IItem {
  price_afm?: string;
  stock_afm?: Stock;
  last_updated_afm?: string;
}

const scrapperName = "Afm";

export class ScrapperAfm extends BaseScrapper<IItemAfm> {
  constructor(public items: IItemAfm[]) {
    super(
      items,
      "",
      scrapperName,
      "https://afm.com.ua",
      "price_afm",
      "stock_afm",
      "last_updated_afm",
      "ssilkaAFM"
    );
  }

  async logIn(page: Page) {
    console.log("Logging in");

    await page.goto("https://afm.com.ua/login");

    const usernameSelector = "input#login";
    const loginInput = await page.waitForSelector(usernameSelector);
    if (loginInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get username element.");
      throw new Error("Failed to log in");
    }
    await loginInput.type(config.shopsCredentials.usernameAfm);

    const passwordSelector = "input#password";
    const passwordInput = await page.waitForSelector(passwordSelector);
    if (passwordInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get password element.");
      throw new Error("Failed to log in");
    }
    await passwordInput.type(config.shopsCredentials.passwordAfm);

    const logInButtonSelector = "input[type=submit]";
    const logInButton = await page.waitForSelector(logInButtonSelector);
    if (logInButton === null) {
      console.log("CRITICAL Failed to log in. Failed to get log in button.");
      throw new Error("Failed to log in");
    }
    await logInButton.click();

    const logOutButtonSelector = "a.header__login-logout-btn";
    const logOutButton = await page.waitForSelector(logOutButtonSelector);
    if (logOutButton === null) {
      console.log("CRITICAL Failed to log in. Failed to get log out button.");
      throw new Error("Failed to log in");
    }
    const checkText = await logOutButton.evaluate((el) => el.textContent);
    if (checkText !== "Вийти") {
      console.log(
        "CRITICAL Failed to log in. Failed to get log out button as a successfull log in check."
      );
      throw new Error("Failed to log in");
    }

    console.log("Logged in");
  }

  async scrapItem(page: Page, item: IItemAfm) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.ssilkaAFM}'`
    );

    await page.goto(item.ssilkaAFM);
    try {
      const inStock = await this.isInStock(page);

      const price = inStock ? await this.getPriceFromPage(page) : "-1";

      item.stock_afm = inStock ? "В наличии" : "Нет в наличии";
      item.price_afm = price;
      item.last_updated_afm = this.scrappingStartedAt;
    } catch (e) {
      console.log(`WARNING Failed to scrap item due to error: ${e}`);
      item.stock_afm = "failed to scrap";
      item.price_afm = "failed to scrap";
      item.last_updated_afm = this.scrappingStartedAt;
    }

    console.log(`Finished scrapping item '${item["g:mpn"]}'`);

    return item;
  }

  async isInStock(page: Page) {
    const el = await page.waitForSelector(
      "div.product-control button[type=button]"
    );
    if (el === null) {
      console.log("CRITICAL Failed to scrap stock");
      return false;
    }
    const attributeText = await el.evaluate((el) => el.getAttribute("title"));
    return attributeText === "Додати до кошика" ? true : false;
  }

  async getPriceFromPage(page: Page) {
    const el = await page.waitForSelector("span.price-uah");
    if (el === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const srcTxt = await el.evaluate((el) => el.getAttribute("content"));
    if (srcTxt === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const price = srcTxt.replace(/\./g, ",");
    return price;
  }

  @RetryScrapperRun(3, scrapperName)
  async runScrapperWrapper(): Promise<IItemAfm[]> {
    return await this.runScrapper();
  }
}
