import { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";
import { Stock } from "../types.js";
import { BaseScrapper } from "./baseScrapper.js";
import { RetryScrapperRun } from "./utils.js";
import { config } from "../config.js";

export interface IItemFlatCable extends IItem {
  price_fc?: string;
  stock_fc?: Stock;
  last_updated_fc?: string;
}

const scrapperName = "FlatCable";

export class ScrapperFlatCable extends BaseScrapper<IItemFlatCable> {
  constructor(
    public items: IItemFlatCable[],
    public scrappingStartedAt: string = ""
  ) {
    super(
      items,
      "",
      scrapperName,
      "https://flat-cable.com.ua",
      "price_fc",
      "stock_fc",
      "last_updated_fc",
      "ssilkaFlatCable"
    );
  }

  async logIn(page: Page) {
    console.log("Logging in");

    await page.goto("https://flat-cable.com.ua/auth/?backurl=/");

    const usernameSelector = "input[name=USER_LOGIN]";
    const loginInput = await page.waitForSelector(usernameSelector);
    if (loginInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get username element.");
      throw new Error("Failed to log in");
    }
    await loginInput.type(config.shopsCredentials.usernameFlatCable);

    const passwordSelector = "input[name=USER_PASSWORD]";
    const passwordInput = await page.waitForSelector(passwordSelector);
    if (passwordInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get password element.");
      throw new Error("Failed to log in");
    }
    await passwordInput.type(config.shopsCredentials.passwordFlatCable);

    const logInButtonSelector =
      "div.auth-submit-container > input[type=submit]";
    const logInButton = await page.waitForSelector(logInButtonSelector);
    if (logInButton === null) {
      console.log("CRITICAL Failed to log in. Failed to get log in button.");
      throw new Error("Failed to log in");
    }
    await logInButton.click();

    const testSelector = "xpath//html/body/div[2]/div[3]/div/div/div[2]/p[1]";
    const testElement = await page.waitForSelector(testSelector);
    if (testElement === null) {
      console.log(
        "CRITICAL Failed to log in. Failed to get test element after log in."
      );
      throw new Error("Failed to log in");
    }
    const checkText = await testElement.evaluate((el) => el.textContent);
    if (checkText !== "Вы зарегистрированы и успешно авторизовались.") {
      console.log(
        "CRITICAL Failed to log in. Failed to get successfull log in check."
      );
      throw new Error("Failed to log in");
    }

    console.log("Logged in");
  }

  async scrapItem(page: Page, item: IItemFlatCable) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.ssilkaFlatCable}'`
    );

    await page.goto(item.ssilkaFlatCable);

    try {
      const inStock = await this.isInStock(page);

      const price = inStock ? await this.getPriceFromPage(page) : "-1";

      item.stock_fc = inStock ? "В наличии" : "Нет в наличии";
      item.price_fc = price;
      item.last_updated_fc = this.scrappingStartedAt;
    } catch (e) {
      console.log(`WARNING Failed to scrap item due to error: ${e}`);
      item.stock_fc = "failed to scrap";
      item.price_fc = "failed to scrap";
      item.last_updated_fc = this.scrappingStartedAt;
    }

    console.log(`Finished scrapping item '${item["g:mpn"]}'`);

    return item;
  }

  async isInStock(page: Page) {
    const stockSelector = await page.waitForSelector(
      "xpath//html/body/div[2]/div[4]/div/div[2]/div[2]/div[2]/div/div[2]/div[2]/a/img"
    );
    const stockValue = await stockSelector?.evaluate((el) =>
      el.getAttribute("alt")
    );

    let isInStock;
    if (stockValue === "Мало" || stockValue === "В наличии") {
      isInStock = true;
    } else if (stockValue === "Продано") {
      isInStock = false;
    } else {
      console.log("CRITICAL Failed to scrap stock");
      isInStock = false;
    }

    return isInStock;
  }

  async getPriceFromPage(page: Page) {
    const el = await page.waitForSelector(
      "div#smallElementTools span.priceVal"
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
    const price = srcTxt.replace(/[^0-9.]/g, "").replace(/\.(?=.*\.)/g, "");
    return price;
  }

  @RetryScrapperRun(3, scrapperName)
  async runScrapperWrapper(): Promise<IItemFlatCable[]> {
    return await this.runScrapper();
  }
}
