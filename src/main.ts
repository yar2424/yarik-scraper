import { getCategoriesThatShouldRunToday } from "./scheduler";
import { runScrappersForCategoriesIds } from "./scrappingOrchestrator";
import { instantiateConfig, config } from "./config";
import { logRunEnd, logRunStart } from "./progressLogger";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

async function main() {
  console.log(
    `Vas vitaje Parser. Zaraz ${new Date().toLocaleString("en-GB", {
      timeZone: "CET",
    })} `
  );

  await instantiateConfig();

  try {
    await logRunStart();
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      console.log(
        `INFO There is an already running instance of a scrapper - exiting. NODE_ENV=${process.env.NODE_ENV}`
      );
      process.exit(0);
    }
    throw err;
  }

  const categoriesThatShouldRunToday = getCategoriesThatShouldRunToday();
  console.log(
    `Will scrap ${categoriesThatShouldRunToday.length} categories today: ${categoriesThatShouldRunToday}`
  );
  await runScrappersForCategoriesIds(categoriesThatShouldRunToday);
  console.log("Finished all scrapping for today");
  logRunEnd();
  process.exit(0);
}

main();
