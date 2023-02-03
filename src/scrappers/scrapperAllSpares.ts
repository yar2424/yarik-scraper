import { Page } from "puppeteer";
import { config } from "../config.js";
import { IItem } from "../crmXmlHelper.js";
import { Stock } from "../types.js";
import { BaseScrapper } from "./baseScrapper.js";
import { RetryScrapperRun } from "./utils.js";

export interface IItemAllSpares extends IItem {
  price_as?: string;
  stock_as?: Stock;
  last_updated_as?: string;
}

const scrapperName = "AllSpares";

export class ScrapperAllSpares extends BaseScrapper<IItemAllSpares> {
  constructor(
    public items: IItemAllSpares[],
    public scrappingStartedAt: string = ""
  ) {
    super(
      items,
      "",
      scrapperName,
      "https://all-spares.ua",
      "price_as",
      "stock_as",
      "last_updated_as",
      "ssilkaAllspares"
    );
  }

  async logIn(page: Page) {
    console.log("Logging in");

    await page.goto("https://all-spares.ua/ru/");

    // open log in pop up
    const logInPopUpOpenSelector =
      "xpath//html/body/div[1]/div/header/div[2]/div/div/div[4]/div/div[1]";
    const logInPopUpOpenButton = await page.waitForSelector(
      logInPopUpOpenSelector
    );
    if (logInPopUpOpenButton === null) {
      console.log("CRITICAL Failed to log in. Failed to get log in button.");
      throw new Error("Failed to log in");
    }
    await logInPopUpOpenButton.evaluate((b) => (b as HTMLElement).click());

    // fill in creds
    const usernameSelector =
      "xpath//html/body/div[2]/div/div[1]/div/div/div[2]/div[1]/div/div[2]/div/div/input";
    const loginInput = await page.waitForSelector(usernameSelector);
    if (loginInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get username element.");
      throw new Error("Failed to log in");
    }
    await loginInput.type(config.shopsCredentials.usernameAllSpares);

    const passwordSelector =
      "xpath//html/body/div[2]/div/div[1]/div/div/div[2]/div[1]/div/div[3]/div/div/input";
    const passwordInput = await page.waitForSelector(passwordSelector);
    if (passwordInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get password element.");
      throw new Error("Failed to log in");
    }
    await passwordInput.type(config.shopsCredentials.passwordAllSpares);

    await new Promise((r) => setTimeout(r, 1000));
    const logInButtonSelector =
      "xpath//html/body/div[2]/div/div[1]/div/div/div[2]/div[1]/div/div[4]/div[2]/div[2]/div";
    const logInButton = await page.waitForSelector(logInButtonSelector);

    if (logInButton === null) {
      console.log("CRITICAL Failed to log in. Failed to get log in button.");
      throw new Error("Failed to log in");
    }

    await logInButton.evaluate((b) => {
      (b as HTMLElement).click();
    });

    await new Promise((r) => setTimeout(r, 3000));

    // make pupeteer screenshot
    await page.screenshot({ path: "screenshots/afterLogIn.png" });

    const testSelector =
      "xpath//html/body/div[1]/div/header/div[2]/div/div/div[4]/div/div[3]/div/div";
    const testElement = await page.waitForSelector(testSelector);
    if (testElement === null) {
      console.log(
        "CRITICAL Failed to log in. Failed to get test element after log in."
      );
      throw new Error("Failed to log in");
    }
    const checkText = await testElement.evaluate((el) =>
      el.getAttribute("name")
    );
    if (checkText !== "logout") {
      console.log(
        "CRITICAL Failed to log in. Failed to get successfull log in check."
      );
      throw new Error("Failed to log in");
    }

    console.log("Logged in");
  }

  async scrapItem(page: Page, item: IItemAllSpares) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.ssilkaAllspares}'`
    );

    await page.goto(item.ssilkaAllspares);
    try {
      const inStock = await this.isInStock(page);

      const price = inStock ? await this.getPriceFromPage(page) : "-1";

      item.stock_as = inStock ? "В наличии" : "Нет в наличии";
      item.price_as = price;
      item.last_updated_as = this.scrappingStartedAt;
    } catch (e) {
      console.log(`WARNING Failed to scrap item due to error: ${e}`);
      item.stock_as = "failed to scrap";
      item.price_as = "failed to scrap";
      item.last_updated_as = this.scrappingStartedAt;
    }

    console.log(`Finished scrapping item '${item["g:mpn"]}'`);

    return item;
  }

  async isInStock(page: Page) {
    const stockContainerElement = await page.waitForSelector(
      "xpath//html/body/div[1]/div/div[1]/div/main/div/div[4]/div[2]/div/div[1]/div/div[2]/div"
    );
    if (stockContainerElement === null) {
      console.log("CRITICAL Failed to scrap stock");
      return false;
    }
    const stockElement = await stockContainerElement.$(
      "span.component_product_in-stock_title"
    );

    if (stockElement === null) {
      return false;
    } else {
      return true;
    }
  }

  async getPriceFromPage(page: Page) {
    const priceContainer = await page.waitForSelector(
      'div.prp_static-button.action-zone.acz.-main div[space="page/product/price-block"] div[space="component/product/price"]'
    );
    if (priceContainer === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const priceElement = await priceContainer.$("div.-current.-red");
    if (priceElement === null) {
      return "-1";
    }
    const priceTxt = await priceElement.evaluate((el) => el.textContent);
    if (priceTxt === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const price = priceTxt.replace(/[^0-9.]/g, "").replace(/[.]/g, ",");
    return price;
  }

  @RetryScrapperRun(3, scrapperName)
  async runScrapperWrapper(): Promise<IItemAllSpares[]> {
    return await this.runScrapper();
  }
}
