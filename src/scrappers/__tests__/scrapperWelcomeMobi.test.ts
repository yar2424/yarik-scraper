import { instantiateConfig } from "../../config";
import { IItem } from "../../crmXmlHelper";
import { ScrapperWelcomeMobi } from "../scrapperWelcomeMobi";

test("test", async () => {
  await instantiateConfig();
  const items = [
    {
      ssilkaWelcomeMobi:
        "https://welcome-mobi.com.ua/shop/product/displey-Google-Pixel-6A-v-sbore-s-sensorom-black-service-orig",
    },
    {
      ssilkaWelcomeMobi:
        "https://welcome-mobi.com.ua/shop/product/displey-ASUS-ZenFone-Go--ZB551KL--with-touchscreen-black",
    },
  ] as IItem[];
  const scrapper = new ScrapperWelcomeMobi(items);
  const itemsWithScrappedData = await scrapper.runScrapper();
  console.log(itemsWithScrappedData);
}, 60000);
