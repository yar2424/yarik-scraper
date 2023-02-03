import { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";
import { getBrowser } from "./utils.js";

export abstract class BaseScrapper<T extends IItem> {
  constructor(
    public items: T[],
    public scrappingStartedAt: string,
    public scrapperName: string,
    protected validUrlStart: string,
    protected priceFieldName: string,
    protected stockFieldName: string,
    protected lastUpdatedFieldName: string,
    protected urlFieldName: string
  ) {}

  isValidUrl(url): boolean {
    return url.startsWith(this.validUrlStart);
  }

  async runScrapper(): Promise<T[]> {
    console.log(
      `Started ${this.scrapperName} scrapper. Will scrap ${this.items.length} items.`
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

    let itemsWithScrappedData: T[] = [];

    for (let item of this.items) {
      // await new Promise((r) => setTimeout(r, 1000));

      let newItem;
      if (this.isValidUrl(item[this.urlFieldName])) {
        newItem = await this.scrapItem(basePage, item);
      } else {
        console.log(`Item '${item["g:mpn"]}' has missing or invalid link`);
        newItem = {
          ...item,
          [this.priceFieldName]: "no link",
          [this.stockFieldName]: "no link",
          [this.scrappingStartedAt]: this.scrappingStartedAt,
        };
      }
      itemsWithScrappedData.push(newItem);
    }

    await browser.close();

    let end = Date.now();
    let elapsedMilliseconds = end - start;
    console.log(
      `Finished ${this.scrapperName} scrapping. Scrapped ${
        this.items.length
      } items in ${Math.floor(elapsedMilliseconds / 60000)} minutes.`
    );

    return itemsWithScrappedData;
  }

  abstract logIn(page: Page): Promise<void>;

  abstract scrapItem(page: Page, item: T): Promise<T>;

  abstract isInStock(page: Page): Promise<boolean>;

  abstract getPriceFromPage(page: Page): Promise<string>;

  abstract runScrapperWrapper(): Promise<T[]>;
}
