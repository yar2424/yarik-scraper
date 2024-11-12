import { config } from "./config";
import { InputXmlHelper } from "./crmXmlHelper.js";
import { OutputXmlHelper } from "./outputXmlHelper.js";

async function runScrappers(itemsToScrap: any[], context: string) {
  console.log(
    `Will be running scrappers for ${itemsToScrap.length} ${context}: ${itemsToScrap.map((el) =>
      JSON.stringify({
        category: el["g:product_category"],
        mpn: el["g:mpn"],
      })
    )}`
  );

  const scrappersInfo = config.scrappersToRun;
  for (let scrapperInfo of scrappersInfo) {
    const scrapper = new scrapperInfo.class_(itemsToScrap);
    let itemsWithScrappedData;
    try {
      itemsWithScrappedData = await scrapper.runScrapperWrapper();
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
    outputXmlHelper.removeExtraFields();
    outputXmlHelper.sortFields();

    await outputXmlHelper.uploadXMLToS3();
    await outputXmlHelper.uploadXMLToS3InParts(800);
  }
}

export async function runScrappersForCategoriesIds(categoriesIds: number[]) {
  const inputXmlHelper = await InputXmlHelper.instantiateWithCrmData();
  const itemsToScrap = inputXmlHelper.getItemsThatAreChildrenOfCategories(categoriesIds);

  console.log(`Will be running scrappers for ${categoriesIds.length} categories: ${categoriesIds}`);
  await runScrappers(itemsToScrap, "categories");
}

export async function runScrappersForItemsIds(itemIds: string[]) {
  const inputXmlHelper = await InputXmlHelper.instantiateWithCrmData();
  const itemsToScrap = inputXmlHelper.getItemsByIds(itemIds);

  console.log(`Will be running scrappers for ${itemIds.length} items: ${itemIds}`);
  await runScrappers(itemsToScrap, "items");
}
