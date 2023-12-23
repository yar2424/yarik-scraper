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
    {
      ssilkaGsmForsage:
        "https://gsm-forsage.com.ua/displej-samsung-galaxy-a14-4g-sm-a145p-a145r-or-100-service-pack-black-cb-00019050.html",
    },
  ] as IItem[];
  const scrapper = new ScrapperGsmForsage(items);
  const itemsWithScrappedData = await scrapper.runScrapper();
  console.log(itemsWithScrappedData);
}, 60000);
