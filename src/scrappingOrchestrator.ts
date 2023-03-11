import { config } from "./config";
import { InputXmlHelper } from "./crmXmlHelper.js";
import { OutputXmlHelper } from "./outputXmlHelper.js";
import { logProgress } from "./progressLogger";

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

  const scrappersInfo = config.scrappersToRun;
  for (let [scrapperIndex, scrapperInfo] of scrappersInfo.entries()) {
    logProgress(
      (scrapperIndex / scrappersInfo.length) * 100,
      `Running ${scrapperInfo.name} scraper`
    );
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
    outputXmlHelper.sortFields();

    await outputXmlHelper.uploadXMLToS3();
  }
  logProgress(100, "All done!");
}
