import { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";
import { getBrowser, Retry } from "./utils.js";
import fs from "fs";

export interface IItemAllSpares extends IItem {
  price_as?: string;
  stock_as?: "В наличии" | "Нет в наличии";
  last_updated_as?: string;
}

export class ScrapperAllSpares {
  constructor(
    public items: IItemAllSpares[],
    public scrappingStartedAt: string = ""
  ) {}

  getItemsWithValidUrls(): IItemAllSpares[] {
    return this.items.filter((item) =>
      item.ssilkaAllspares.startsWith("https://all-spares.ua")
    );
  }

  @Retry(1, "AllSpares")
  async runScrapper() {
    const itemsToScrap = this.getItemsWithValidUrls();

    console.log(
      `Started AllSpares scrapper. Will scrap ${itemsToScrap.length} items.`
    );
    this.scrappingStartedAt = new Date().toLocaleString("en-GB", {
      timeZone: "CET",
    });

    const browser = await getBrowser();
    const basePage = await browser.newPage();
    await basePage.setDefaultNavigationTimeout(0);

    await this.logIn(basePage);
    // return;

    //time it
    let start = Date.now();

    let itemsWithScrappedData: IItemAllSpares[] = [];

    for (let item of itemsToScrap) {
      itemsWithScrappedData.push(await this.scrapItem(basePage, item));
    }

    await browser.close();

    let end = Date.now();
    let elapsedMilliseconds = end - start;
    console.log(
      `Finished AllSpares scrapping. Scrapped ${
        itemsToScrap.length
      } items in ${Math.floor(elapsedMilliseconds / 60000)} minutes.`
    );

    return itemsWithScrappedData;
  }

  async logIn(page: Page) {
    let debug = false;
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

    // if (debug) {
    //   const pageContent = await page.content();
    //   fs.writeFileSync("screenshots/page.html", pageContent);
    //   await page.screenshot({
    //     path: "screenshots/after-opening-login-popup.png",
    //   });
    // }

    // fill in creds
    const usernameSelector =
      "xpath//html/body/div[2]/div/div[1]/div/div/div[2]/div[1]/div/div[2]/div/div/input";
    const loginInput = await page.waitForSelector(usernameSelector);
    if (loginInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get username element.");
      throw new Error("Failed to log in");
    }
    await loginInput.type("2020.shestopalov@gmail.com");
    console.log("DEBUG Typed in username");

    const passwordSelector =
      "xpath//html/body/div[2]/div/div[1]/div/div/div[2]/div[1]/div/div[3]/div/div/input";
    const passwordInput = await page.waitForSelector(passwordSelector);
    if (passwordInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get password element.");
      throw new Error("Failed to log in");
    }
    await passwordInput.type("All535499");
    console.log("DEBUG Typed in password");

    if (debug) {
      const pageContent = await page.content();
      fs.writeFileSync("screenshots/page.html", pageContent);
      await page.screenshot({ path: "screenshots/after-password.png" });
    }

    // const logInButtonSelector =
    //   'div[space="popup/auth/sign-in"] div[name="submit"]';
    await new Promise((r) => setTimeout(r, 1000));
    const logInButtonSelector =
      "xpath//html/body/div[2]/div/div[1]/div/div/div[2]/div[1]/div/div[4]/div[2]/div[2]/div";
    const logInButton = await page.waitForSelector(logInButtonSelector);
    console.log("got login button element");

    if (logInButton === null) {
      console.log("CRITICAL Failed to log in. Failed to get log in button.");
      throw new Error("Failed to log in");
    }

    // if (debug) {
    //   await page.screenshot({ path: "screenshots/before-click.png" });
    // }
    // await logInButton.click();
    await logInButton.evaluate((b) => {
      (b as HTMLElement).click();
    });
    console.log("DEBUG Clicked log in button");
    if (debug) {
      console.log("a");

      await new Promise((r) => setTimeout(r, 5000));
      console.log("b");
      await page.screenshot({ path: "screenshots/after-click.png" });
      console.log("c");
    }

    // await page.waitForNavigation({ waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 3000));

    const testSelector =
      "xpath//html/body/div[1]/div/header/div[2]/div/div/div[4]/div/div[3]/div/div";
    const testElement = await page.waitForSelector(testSelector);
    console.log("DEBUG Got test element");
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
    if (debug) {
      await page.screenshot({ path: "screenshots/after-check.png" });
      console.log("made screenshot after check");
    }

    console.log("Logged in");
  }

  async scrapItem(page: Page, item: IItemAllSpares) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.ssilkaAllspares}'`
    );

    await page.goto(item.ssilkaAllspares);

    const inStock = await this.isInStock(page);
    console.log(inStock);

    const price = inStock ? await this.getPriceFromPage(page) : "-1";
    console.log(price);

    item.stock_as = inStock ? "В наличии" : "Нет в наличии";
    item.price_as = price;
    item.last_updated_as = this.scrappingStartedAt;

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
    // console.log(stockElement.evaluate(el => el.text));

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
}
