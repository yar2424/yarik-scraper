import { Page } from "puppeteer";
import { IItem } from "../crmXmlHelper.js";
import { Stock } from "../types.js";
import { BaseScrapper } from "./baseScrapper.js";
import { RetryScrapperRun } from "./utils.js";
import { config } from "../config.js";

export interface IItemWelcomeMobi extends IItem {
  price_wm?: string;
  stock_wm?: Stock;
  last_updated_wm?: string;
}

const scrapperName = "WelcomeMobi";

export class ScrapperWelcomeMobi extends BaseScrapper<IItemWelcomeMobi> {
  constructor(
    public items: IItemWelcomeMobi[],
    public scrappingStartedAt: string = ""
  ) {
    super(
      items,
      "",
      scrapperName,
      "https://welcome-mobi.com.ua/",
      "price_wm",
      "stock_wm",
      "last_updated_wm",
      "ssilkaWelcomeMobi"
    );
  }

  async logIn(page: Page) {
    console.log("Logging in");

    const logInUrl = "https://welcome-mobi.com.ua/";

    await page.goto(logInUrl);
    const logInPopUpSelector =
      "xpath//html/body/div[1]/div[1]/header/div[2]/div/div[2]/div[1]/div[1]/div[1]/div/div/nav/ul/li[1]/button";

    const logInPopUpElement = await page.waitForSelector(logInPopUpSelector);
    if (logInPopUpElement === null) {
      console.log("Failed to log in");
      throw new Error("Failed to log in");
    }
    await logInPopUpElement.click();

    const usernameSelector =
      "xpath//html/body/div[1]/div[4]/div[3]/div/div/div/form/div[1]/label[1]/span[2]/input";
    const loginInput = await page.waitForSelector(usernameSelector);
    if (loginInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get username element.");
      throw new Error("Failed to log in");
    }
    await loginInput.type(config.shopsCredentials.usernameWelcomeMobi);

    const passwordSelector =
      "xpath//html/body/div[1]/div[4]/div[3]/div/div/div/form/div[1]/label[2]/span[2]/input";
    const passwordInput = await page.waitForSelector(passwordSelector);
    if (passwordInput === null) {
      console.log("CRITICAL Failed to log in. Failed to get password element.");
      throw new Error("Failed to log in");
    }
    await passwordInput.type(config.shopsCredentials.passwordWelcomeMobi);

    const logInButtonSelector =
      "xpath//html/body/div[1]/div[4]/div[3]/div/div/div/form/div[2]/span[2]/span[1]/span/input";
    const logInButton = await page.waitForSelector(logInButtonSelector);
    if (logInButton === null) {
      console.log("CRITICAL Failed to log in. Failed to get log in button.");
      throw new Error("Failed to log in");
    }
    await logInButton.click();

    await new Promise((res) => setTimeout(res, 3000));

    const testSelector =
      "xpath//html/body/div[1]/div[1]/header/div[2]/div/div[2]/div[1]/div[1]/div[1]/div/div/nav/ul/li[3]/button/span";
    const testElement = await page.waitForSelector(testSelector);
    if (testElement === null) {
      console.log(
        "CRITICAL Failed to log in. Failed to get test element after log in."
      );
      throw new Error("Failed to log in");
    }
    const checkText = await testElement.evaluate((el) => el.textContent);
    if (checkText !== "Вихід") {
      console.log(
        "CRITICAL Failed to log in. Failed to get successfull log in check."
      );
      throw new Error("Failed to log in");
    }

    console.log("Logged in");
  }

  async scrapItem(page: Page, item: IItemWelcomeMobi) {
    console.log(
      `Started scrapping item '${item["g:mpn"]}' '${item.ssilkaWelcomeMobi}'`
    );

    await page.goto(item.ssilkaWelcomeMobi);

    try {
      const inStock = await this.isInStock(page);

      const price = inStock ? await this.getPriceFromPage(page) : "-1";

      item.stock_wm = inStock ? "В наличии" : "Нет в наличии";
      item.price_wm = price;
      item.last_updated_wm = this.scrappingStartedAt;
    } catch (e) {
      console.log(`WARNING Failed to scrap item due to error: ${e}`);
      item.stock_wm = "failed to scrap";
      item.price_wm = "failed to scrap";
      item.last_updated_wm = this.scrappingStartedAt;
    }

    console.log(`Finished scrapping item '${item["g:mpn"]}'`);

    return item;
  }

  async isInStock(page: Page) {
    const stockSelector = await page.waitForSelector(
      "xpath//html/body/div[1]/div[3]/div/div[1]/div[3]/div[4]"
    );
    const stockValue = await stockSelector?.evaluate((el) =>
      el.getAttribute("class")
    );

    let isInStock;
    if (stockValue?.includes("not-avail_wrap")) {
      isInStock = false;
    } else if (stockValue?.includes("prod")) {
      isInStock = true;
    } else {
      console.log("CRITICAL Failed to scrap stock");
      isInStock = false;
    }

    return isInStock;
  }

  async getPriceFromPage(page: Page) {
    const hryvniasEl = await page.waitForSelector(
      "xpath//html/body/div[1]/div[3]/div/div[1]/div[3]/div[2]/div[1]/div/div/div/div[1]/span[1]"
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

    const coinsEl = await page.waitForSelector(
      "xpath//html/body/div[1]/div[3]/div/div[1]/div[3]/div[2]/div[1]/div/div/div/div[1]/sup"
    );
    if (coinsEl === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const coinsSrcTxt = await coinsEl.evaluate((el) => el.textContent);
    if (coinsSrcTxt === null) {
      console.log("CRITICAL Failed to scrap price");
      return "-1";
    }
    const coinsAmount = coinsSrcTxt.replace(/[^0-9]/g, "");

    const price = hryvniasAmount + "," + coinsAmount;
    return price;
  }

  @RetryScrapperRun(3, scrapperName)
  async runScrapperWrapper(): Promise<IItemWelcomeMobi[]> {
    return await this.runScrapper();
  }
}
