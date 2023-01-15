import { getCategoriesThatShouldRunToday } from "./scheduler";
import { runScrappersForCategoriesIds } from "./scrappingOrchestrator";

function main() {
  console.log(
    `Vas vitaje Parser. Zaraz ${new Date().toLocaleString("en-GB", {
      timeZone: "CET",
    })} `
  );

  const categoriesThatShouldRunToday = getCategoriesThatShouldRunToday();
  console.log(
    `Will scrap ${categoriesThatShouldRunToday.length} categories today: ${categoriesThatShouldRunToday}`
  );
  runScrappersForCategoriesIds(categoriesThatShouldRunToday);
}

main();
