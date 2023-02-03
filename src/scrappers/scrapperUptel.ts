import { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";
import { Stock } from "../types.js";
import { BaseScrapper } from "./baseScrapper.js";
import { RetryScrapperRun } from "./utils.js";
import { config } from "../config.js";

export interface IItemUptel extends IItem {
  price_uptel?: string;
  stock_uptel?: Stock;
  last_updated_uptel?: string;
}

const scrapperName = "Uptel";

export class ScrapperUptel extends BaseScrapper<IItemUptel> {
  constructor(
    public items: IItemUptel[],
    public scrappingStartedAt: string = ""
  ) {
    super(
      items,
      "",
      scrapperName,
      "https://uptel.com.ua",
      "price_uptel",
      "stock_uptel",
      "last_updated_uptel",
      "ssilkaUptel"
    );
  }

  async logIn(page: Page) {
    console.log("Logging in");

    await page.goto("https://uptel.com.ua/clients.htm");

    const usernameSelector = "form[name=login_form] input[name=login]";
    const loginInput = await page.waitForSelector(usernameSelector);
    if (loginInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get username element.");
      throw new Error("Failed to log in");
    }
    await loginInput.type(config.shopsCredentials.usernameUptel);

    const passwordSelector = "form[name=login_form] input[name=password]";
    const passwordInput = await page.waitForSelector(passwordSelector);
    if (passwordInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get password element.");
      throw new Error("Failed to log in");
    }
    await passwordInput.type(config.shopsCredentials.passwordUptel);

    const logInButtonSelector = "form[name=login_form] input[type=submit]";
    const logInButton = await page.waitForSelector(logInButtonSelector);
    if (logInButton === null) {
      console.log("CRITICAL Failed to log in. Failed to get log in button.");
      throw new Error("Failed to log in");
    }
    await logInButton.click();

    const testH1Selector = "#content > div.largepage > div > h1";
    const testH1 = await page.waitForSelector(testH1Selector);
    if (testH1 === null) {
      console.log(
        "CRITICAL Failed to log in. Failed to get test element after log in."
      );
      throw new Error("Failed to log in");
    }
    const checkText = await testH1.evaluate((el) => el.textContent);
    if (checkText !== "Особистий кабінет") {
      console.log(
        "CRITICAL Failed to log in. Failed to get log out button as a successfull log in check."
      );
      throw new Error("Failed to log in");
    }

    console.log("Logged in");
  }

  async scrapItem(page: Page, item: IItemUptel) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.ssilkaUptel}'`
    );

    await page.goto(item.ssilkaUptel);

    try {
      const inStock = await this.isInStock(page);

      const price = inStock ? await this.getPriceFromPage(page) : "-1";

      item.stock_uptel = inStock ? "В наличии" : "Нет в наличии";
      item.price_uptel = price;
      item.last_updated_uptel = this.scrappingStartedAt;
    } catch (e) {
      console.log(`WARNING Failed to scrap item due to error: ${e}`);
      item.stock_uptel = "failed to scrap";
      item.price_uptel = "failed to scrap";
      item.last_updated_uptel = this.scrappingStartedAt;
    }

    console.log(`Finished scrapping item '${item["g:mpn"]}'`);

    return item;
  }

  async isInStock(page: Page) {
    // is in stock if present on any of warehouses
    // warehouse a
    const warehouseASelector = await page.waitForSelector(
      "xpath//html/body/div[1]/div[2]/div[2]/div/div[1]/div/div[2]/div/table/tbody/tr[3]/td[2]/span"
    );
    const warehouseAValue = await warehouseASelector?.evaluate(
      (el) => el.textContent
    );
    let warehouseAIsInStock;
    if (warehouseAValue === "Є") {
      warehouseAIsInStock = true;
    } else if (warehouseAValue === "Немає") {
      warehouseAIsInStock = false;
    } else {
      console.log("CRITICAL Failed to scrap warehouse A stock");
      warehouseAIsInStock = false;
    }

    // warehouse b
    const warehouseBSelector = await page.waitForSelector(
      "xpath//html/body/div[1]/div[2]/div[2]/div/div[1]/div/div[2]/div/table/tbody/tr[4]/td[2]/span"
    );
    const warehouseBValue = await warehouseBSelector?.evaluate(
      (el) => el.textContent
    );
    let warehouseBIsInStock;
    if (warehouseBValue === "Є") {
      warehouseBIsInStock = true;
    } else if (warehouseBValue === "Немає") {
      warehouseBIsInStock = false;
    } else {
      console.log("CRITICAL Failed to scrap warehouse B stock");
      warehouseBIsInStock = false;
    }

    // warehouse local
    const warehouseLocalSelector = await page.waitForSelector(
      "xpath//html/body/div[1]/div[2]/div[2]/div/div[1]/div/div[2]/div/table/tbody/tr[5]/td[2]/span"
    );
    const warehouseLocalValue = await warehouseLocalSelector?.evaluate(
      (el) => el.textContent
    );
    let warehouseLocalIsInStock;
    if (warehouseLocalValue === "Є в наявності") {
      warehouseLocalIsInStock = true;
    } else if (warehouseLocalValue === "Немає в наявності") {
      warehouseLocalIsInStock = false;
    } else {
      console.log("CRITICAL Failed to scrap warehouse local stock");
      warehouseLocalIsInStock = false;
    }

    return [
      warehouseAIsInStock,
      warehouseBIsInStock,
      warehouseLocalIsInStock,
    ].some((el) => el);
  }

  async getPriceFromPage(page: Page) {
    const el = await page.waitForSelector("span.retail_price > span");
    if (el === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const srcTxt = await el.evaluate((el) => el.textContent);
    if (srcTxt === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    if (srcTxt === "уточнюйте") {
      return "-1";
    }
    const price = srcTxt.replace(/[^0-9,.]/g, "").replace(/\./g, ",");
    return price;
  }
  @RetryScrapperRun(3, scrapperName)
  async runScrapperWrapper(): Promise<IItemUptel[]> {
    return await this.runScrapper();
  }
}
