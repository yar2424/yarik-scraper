import { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";
import { Stock } from "../types.js";
import { BaseScrapper } from "./baseScrapper.js";
import { RetryScrapperRun } from "./utils.js";

export interface IItemDisplayko extends IItem {
  price_displayko?: string;
  stock_displayko?: Stock;
  last_updated_displayko?: string;
}

const scrapperName = "Displayko";

export class ScrapperDisplayko extends BaseScrapper<IItemDisplayko> {
  constructor(
    public items: IItemDisplayko[],
    public scrappingStartedAt: string = ""
  ) {
    super(
      items,
      "",
      scrapperName,
      "https://displayko.com.ua/",
      "price_displayko",
      "stock_displayko",
      "last_updated_displayko",
      "ssilkaDisplayko"
    );
  }

  async logIn(page: Page) {}

  async scrapItem(page: Page, item: IItemDisplayko) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.ssilkaDisplayko}'`
    );

    await page.goto(item.ssilkaDisplayko);

    try {
      const inStock = await this.isInStock(page);

      const price = inStock ? await this.getPriceFromPage(page) : "-1";

      item.stock_displayko = inStock ? "В наличии" : "Нет в наличии";
      item.price_displayko = price;
      item.last_updated_displayko = this.scrappingStartedAt;
    } catch (e) {
      console.log(`WARNING Failed to scrap item due to error: ${e}`);
      item.stock_displayko = "failed to scrap";
      item.price_displayko = "failed to scrap";
      item.last_updated_displayko = this.scrappingStartedAt;
    }

    console.log(`Finished scrapping item '${item["g:mpn"]}'`);

    return item;
  }

  async isInStock(page: Page) {
    const notInStockSelector = await page.waitForSelector(
      "xpath//html/body/div[3]/div/div[2]/div/div/div/div/div[1]/div/div[2]/div[2]/div/div[3]/div/div[2]"
    );
    const notInStockValue = await notInStockSelector?.evaluate((el) =>
      el.getAttribute("class")
    );

    const inStockSelector = await page.waitForSelector(
      "xpath//html/body/div[3]/div/div[2]/div/div/div/div/div[1]/div/div[2]/div[2]/div/div[3]/div/div[1]"
    );
    const inStockValue = await inStockSelector?.evaluate((el) =>
      el.getAttribute("class")
    );

    let isInStock;
    if (notInStockValue?.includes("hidden")) {
      isInStock = true;
    } else if (inStockValue?.includes("hidden")) {
      isInStock = false;
    } else {
      console.log("CRITICAL Failed to scrap stock");
      isInStock = false;
    }

    return isInStock;
  }

  async getPriceFromPage(page: Page) {
    const hryvniasEl = await page.waitForSelector(
      "xpath//html/body/div[3]/div/div[2]/div/div/div/div/div[1]/div/div[2]/div[2]/div/div[2]/div[1]/div/div/div/span[1]"
    );
    if (hryvniasEl === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const hryvniasSrcTxt = await hryvniasEl.evaluate((el) => el.textContent);
    if (hryvniasSrcTxt === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const hryvniasAmount = hryvniasSrcTxt.replace(/[^0-9]/g, "");

    const coinsAmount = "00";

    const price = hryvniasAmount + "," + coinsAmount;
    return price;
  }

  @RetryScrapperRun(3, scrapperName)
  async runScrapperWrapper(): Promise<IItemDisplayko[]> {
    return await this.runScrapper();
  }
}
