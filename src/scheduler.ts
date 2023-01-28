import { config } from "./config";

export function getCategoriesThatShouldRunToday(
  categoriesSchedules = config.schedule
) {
  const categoriesToRun: number[] = [];
  const now = Date.now();
  for (let categorySchedule of categoriesSchedules) {
    const msElapsed = now - categorySchedule.startDate.getTime();
    const daysElapsed = Math.floor(msElapsed / 1000 / 60 / 60 / 24);
    if (daysElapsed % categorySchedule.intervalInDays === 0) {
      categoriesToRun.push(categorySchedule.categoryId);
    }
  }
  return categoriesToRun;
}
