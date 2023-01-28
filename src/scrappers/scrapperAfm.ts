// /html/body/  div/  div[4]/    div[2]/             div[2]/                   div/  div[2]/div[1]/     div/  div[2]/            span   /span
// /html/body/  div/  div[4]/    div[2]/             div[2]/                   div/  div   /div[1]/     div/  div[2]/            span[2]/span
//       body > div > div.main > div.main__content > div.main__content-block > div > div >  div.price > div > div:nth-child(3) > span:nth-child(2) > span

import puppeteer, { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";
import { getBrowser, Retry } from "./utils.js";

export interface IItemAfm extends IItem {
  price_afm?: string;
  stock_afm?: "В наличии" | "Нет в наличии";
  last_updated_afm?: string;
}

export class ScrapperAfm {
  constructor(
    public items: IItemAfm[],
    public scrappingStartedAt: string = ""
  ) {}

  getItemsWithValidUrls(): IItemAfm[] {
    return this.items.filter((item) =>
      item.ssilkaAFM.startsWith("https://afm.com.ua")
    );
  }

  @Retry(3, "Afm")
  async runScrapper() {
    const itemsToScrap = this.getItemsWithValidUrls();

    console.log(
      `Started Afm scrapper. Will scrap ${itemsToScrap.length} items.`
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

    let itemsWithScrappedData: IItemAfm[] = [];

    for (let item of itemsToScrap) {
      await new Promise((r) => setTimeout(r, 1000));
      itemsWithScrappedData.push(await this.scrapItem(basePage, item));
    }

    await browser.close();

    let end = Date.now();
    let elapsedMilliseconds = end - start;
    console.log(
      `Finished Afm scrapping. Scrapped ${
        itemsToScrap.length
      } items in ${Math.floor(elapsedMilliseconds / 60000)} minutes.`
    );

    return itemsWithScrappedData;
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
    await loginInput.type("kravchenko989dima@gmail.com");

    const passwordSelector = "input#password";
    const passwordInput = await page.waitForSelector(passwordSelector);
    if (passwordInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get password element.");
      throw new Error("Failed to log in");
    }
    await passwordInput.type("Kopop1996");

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

    const inStock = await this.isInStock(page);

    const price = inStock ? await this.getPriceFromPage(page) : "-1";

    item.stock_afm = inStock ? "В наличии" : "Нет в наличии";
    item.price_afm = price;
    item.last_updated_afm = this.scrappingStartedAt;

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
}
