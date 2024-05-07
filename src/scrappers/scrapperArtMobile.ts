import { Page } from "puppeteer";
import { config } from "../config.js";
import { IItem } from "../crmXmlHelper.js";
import { Stock } from "../types.js";
import { BaseScrapper } from "./baseScrapper.js";
import { RetryScrapperRun } from "./utils.js";

export interface IItemArtMobile extends IItem {
  price_am?: string;
  stock_am?: Stock;
  last_updated_am?: string;
}

const scrapperName = "ArtMobile";

export class ScrapperArtMobile extends BaseScrapper<IItemArtMobile> {
  constructor(
    public items: IItemArtMobile[],
    public scrappingStartedAt: string = ""
  ) {
    super(
      items,
      "",
      scrapperName,
      "https://artmobile.ua",
      "price_am",
      "stock_am",
      "last_updated_am",
      "Ssilkaartmobile"
    );
  }

  async logIn(page: Page) {
    console.log("Logging in");

    await page.goto("https://artmobile.ua/users/session");

    const usernameSelector =
      "xpath//html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/form/div/div[1]/div[1]/input";
    await page.waitForSelector(usernameSelector);
    await page.type(
      usernameSelector,
      config.shopsCredentials.usernameArtMobile
    );

    const passwordSelector =
      "xpath//html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/form/div/div[2]/div[1]/input";
    await page.waitForSelector(passwordSelector);
    await page.type(
      passwordSelector,
      config.shopsCredentials.passwordArtMobile
    );

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
    // Same fix is needed as one already done below for getPriceFromPage
    //
    // const [el] = await page.$x(
    //   "/html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/div[4]/ul/li/div/div[2]/form/button"
    // );
    // return el === undefined;
    return false;
  }

  async getPriceFromPage(page: Page) {
    const el = await page.waitForSelector(
      "xpath//html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/div[4]/div[1]/div[1]/div/div"
    );
    if (el === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const srcTxt = await el.evaluate((el) => el.getAttribute("content"));
    if (srcTxt === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const price = srcTxt.replace(/[^0-9,]/g, "");
    return price;

    // const [el] = await page.$x(
    //   "/html/body/div[2]/div[1]/div[4]/div/div[1]/div/div[2]/div/div[4]/div[1]/div[1]/div/div"
    // );
    // const src = await el.getProperty("textContent");
    // const srcTxt = await src.jsonValue();
    // if (srcTxt === null) {
    //   console.log(
    //     `WARNING Couldn't retrieve price even though isInStock check passed`
    //   );
    //   return "-1";
    // }
    // const price = srcTxt.replace(/[^0-9,]/g, "");
    // return price;
  }

  @RetryScrapperRun(3, scrapperName)
  async runScrapperWrapper(): Promise<IItemArtMobile[]> {
    return await this.runScrapper();
  }
}
