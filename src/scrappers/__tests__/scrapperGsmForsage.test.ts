import { instantiateConfig } from "../../config";
import { IItem } from "../../crmXmlHelper";
import { ScrapperGsmForsage } from "../scrapperGsmForsage";

test("test", async () => {
  await instantiateConfig();
  const items = [
    {
      ssilkaGsmForsage:
        "https://gsm-forsage.com.ua/displej-google-pixel-complete-with-touch-white-ref-original-cb-00007185.html",
    },
    {
      ssilkaGsmForsage:
        "https://gsm-forsage.com.ua/displej-google-pixel-xl-complete-with-touch-white-ref-original-cb-00007186.html",
    },
  ] as IItem[];
  const scrapper = new ScrapperGsmForsage(items);
  const itemsWithScrappedData = await scrapper.runScrapper();
  console.log(itemsWithScrappedData);
}, 60000);
