import { getCategoriesThatShouldRunToday } from "./scheduler";
import { getDynamicIDs } from "./dynosaurus";
import { runScrappersForItemsIds, runScrappersForCategoriesIds } from "./scrappingOrchestrator";
import { instantiateConfig } from "./config";
import fs from "fs";

async function main() {
  console.log(
    `Vas vitaje Parser. Zaraz ${new Date().toLocaleString("en-GB", {
      timeZone: "CET",
    })} `
  );

  await instantiateConfig();

  if (process.env.NODE_ENV === "dynamic")
  {
    const dynamicIDs = getDynamicIDs();
    console.log(
      `Will scrap dynamicaly ${dynamicIDs.length} items: ${dynamicIDs}`
    );

    await runScrappersForItemsIds(dynamicIDs);
  } else {

    const categoriesThatShouldRunToday = getCategoriesThatShouldRunToday();
    console.log(
      `Will scrap ${categoriesThatShouldRunToday.length} categories today: ${categoriesThatShouldRunToday}`
    );

    await runScrappersForCategoriesIds(categoriesThatShouldRunToday);
  }

  console.log("Finished all scrapping for today");
  process.exit(0);
}

main();
