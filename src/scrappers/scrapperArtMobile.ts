import puppeteer, { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";
import { Stock } from "../types.js";
import { getBrowser, RetryScrapperRun } from "./utils.js";

export interface IItemArtMobile extends IItem {
  price_am?: string;
  stock_am?: Stock;
  last_updated_am?: string;
}

export class ScrapperArtMobile {
  constructor(
    public items: IItemArtMobile[],
    public scrappingStartedAt: string = ""
  ) {}

  getItemsWithValidUrls(): IItemArtMobile[] {
    return this.items.filter((item) =>
      item.Ssilkaartmobile.startsWith("https://artmobile.ua")
    );
  }

  @RetryScrapperRun(3, "ArtMobile")
  async runScrapper() {
    const itemsToScrap = this.getItemsWithValidUrls();

    console.log(
      `Started ArtMobile scrapper. Will scrap ${itemsToScrap.length} items.`
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

    let itemsWithScrappedData: IItemArtMobile[] = [];

    for (let item of itemsToScrap) {
      itemsWithScrappedData.push(await this.scrapItem(basePage, item));
    }

    await browser.close();

    let end = Date.now();
    let elapsedMilliseconds = end - start;
    console.log(
      `Finished ArtMobile scrapping. Scrapped ${
        itemsToScrap.length
      } items in ${Math.floor(elapsedMilliseconds / 60000)} minutes.`
    );

    return itemsWithScrappedData;
  }

  async logIn(page: Page) {
    console.log("Logging in");

    await page.goto("https://artmobile.ua/users/session");

    const usernameSelector =
      "xpath//html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/form/div/div[1]/div[1]/input";
    await page.waitForSelector(usernameSelector);
    await page.type(usernameSelector, "2020.shestopalov@gmail.com");

    const passwordSelector =
      "xpath//html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/form/div/div[2]/div[1]/input";
    await page.waitForSelector(passwordSelector);
    await page.type(passwordSelector, "ZZt6pg2ixvph3W8");

    const logInButtonSelector =
      "xpath//html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/form/div/div[3]/input";
    await page.waitForSelector(logInButtonSelector);
    await page.click(logInButtonSelector);

    await new Promise((r) => setTimeout(r, 1000));

    console.log("Logged in");
  }

  async scrapItem(page: Page, item: IItemArtMobile) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.Ssilkaartmobile}'`
    );

    await page.goto(item.Ssilkaartmobile);

    try {
      const inStock = await this.isInStock(page);

      const price = inStock ? await this.getPriceFromPage(page) : "-1";

      item.stock_am = inStock ? "В наличии" : "Нет в наличии";
      item.price_am = price;
      item.last_updated_am = this.scrappingStartedAt;
    } catch (e) {
      console.log(`WARNING Failed to scrap item due to error: ${e}`);
      item.stock_am = "failed to scrap";
      item.price_am = "failed to scrap";
      item.last_updated_am = this.scrappingStartedAt;
    }

    console.log(`Finished scrapping item '${item["g:mpn"]}'`);

    return item;
  }

  async isInStock(page: Page) {
    const [el] = await page.$x(
      "/html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/div[4]/ul/li/div/div[2]/form/button"
    );
    return el === undefined;
  }

  async getPriceFromPage(page: Page) {
    const [el] = await page.$x(
      "/html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/div[4]/div[1]/div[1]/div/div"
    );
    const src = await el.getProperty("textContent");
    const srcTxt = await src.jsonValue();
    if (srcTxt === null) {
      console.log(
        `WARNING Couldn't retrieve price even though isInStock check passed`
      );
      return "-1";
    }
    const price = srcTxt.replace(/[^0-9,]/g, "");
    return price;
  }

  async _getPageDuplicate(browser, page) {
    const duplicatePage = await browser.newPage();
    await duplicatePage.setCookie(...(await page.cookies()));
    await duplicatePage.setDefaultNavigationTimeout(0);
    return duplicatePage;
  }
}
