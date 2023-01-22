import { ScrapperArtMobile } from "./scrappers/scrapperArtMobile.js";
import { ScrapperTPlus } from "./scrappers/scrapperTPlus.js";
import { OutputXmlHelper, Shop } from "./outputXmlHelper.js";
import { InputXmlHelper } from "./crmXmlHelper.js";
import { ScrapperAfm } from "./scrappers/scrapperAfm.js";
import { ScrapperUptel } from "./scrappers/scrapperUptel.js";
import { ScrapperAllSpares } from "./scrappers/scrapperAllSpares.js";
import { ScrapperFlatCable } from "./scrappers/scrapperFlatCable.js";

interface IScrappersInfo {
  name: Shop;
  class_: any;
}

const scrappersInfo: IScrappersInfo[] = [
  { name: "AllSpares", class_: ScrapperAllSpares },
  // { name: "FlatCable", class_: ScrapperFlatCable },
  // { name: "Uptel", class_: ScrapperUptel },
  // { name: "Afm", class_: ScrapperAfm },
  // { name: "ArtMobile", class_: ScrapperArtMobile },
  // { name: "TPlus", class_: ScrapperTPlus },
];

export async function runScrappersForCategoriesIds(categoriesIds: number[]) {
  const inputXmlHelper = await InputXmlHelper.instantiateWithCrmData();
  const itemsToScrap =
    inputXmlHelper.getItemsThatAreChildrenOfCategories(categoriesIds);

  console.log(
    `Will be running scrappers for ${categoriesIds.length} categories: ${categoriesIds}`
  );
  console.log(
    `Will be running scrappers for ${
      itemsToScrap.length
    } items: ${itemsToScrap.map((el) =>
      JSON.stringify({
        category: el["g:product_category"],
        mpn: el["g:mpn"],
      })
    )}`
  );

  for (let scrapperInfo of scrappersInfo) {
    const scrapper = new scrapperInfo.class_(itemsToScrap);
    let itemsWithScrappedData;
    try {
      itemsWithScrappedData = await scrapper.runScrapper();
    } catch (error) {
      console.log(`CRITICAL Failed to run ${scrapperInfo.name} scrapper`);
      continue;
    }

    console.log(`Saving results for ${scrapperInfo.name}`);

    const outputXmlHelper = new OutputXmlHelper();

    await outputXmlHelper.loadXmlFromS3();
    outputXmlHelper.updatePricesForScrappedItems(
      itemsWithScrappedData,
      scrapperInfo.name
    );

    outputXmlHelper.addMissingFields();

    await outputXmlHelper.uploadXMLToS3();
  }
}
