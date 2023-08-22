import { instantiateConfig } from "../../config";
import { IItem } from "../../crmXmlHelper";
import { ScrapperDisplayko } from "../scrapperDisplayko";

test("test", async () => {
  await instantiateConfig();
  const items = [
    {
      ssilkaDisplayko:
        "https://displayko.com.ua/displei-samsung-s23-s911-z-sensoromchornii-original",
    },
    {
      ssilkaDisplayko:
        "https://displayko.com.ua/displei-nokia-1-modul-s-sensorom-chernyi",
    },
  ] as IItem[];
  const scrapper = new ScrapperDisplayko(items);
  const itemsWithScrappedData = await scrapper.runScrapper();
  console.log(itemsWithScrappedData);
}, 60000);
