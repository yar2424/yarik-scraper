import sampleParsedObject from "../__mocks__/parsedCrmXml";
import { ScrapperAllSpares } from "./scrapperAllSpares";

let itemsList = sampleParsedObject.rss.channel.item as any[];
itemsList[0].ssilkaAllspares =
  "https://all-spares.ua/ru/lcd-compatible-with-samsung-a515f-ds-galaxy-a51-black-with-touchscreen-with-frame-original-service-pack-gh82-21669a/";
itemsList[1].ssilkaAllspares =
  "https://all-spares.ua/ru/lcd-compatible-with-samsung-g973-galaxy-s10-green-with-touchscreen-with-frame-original-service-pack-prism-green-gh82-18850e/";
itemsList[2].ssilkaAllspares =
  "https://all-spares.ua/ru/lcd-for-samsung-j700h-ds-galaxy-j7-cell-phone-black-with-touchscreen/";
itemsList[3].ssilkaAllspares =
  "https://all-spares.ua/ru/lcd-compatible-with-samsung-a725-galaxy-a72-a726-galaxy-a72-5g-black-with-frame-original-service-pack-original-glass-gh82-25624a-gh82-25463a-gh82-25460a-gh82-25849a/";

const scrapper = new ScrapperAllSpares(itemsList.slice(0, 4));
(async () => {
  const scrappedData = await scrapper.runScrapper();
  console.log(scrappedData);
  console.log(scrappedData);
})();
