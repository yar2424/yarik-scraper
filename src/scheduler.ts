const categoriesSchedules_ = [
  // phone screens
  // {
  //   categoryId: 54,
  //   startDate: new Date("2023-01-10"),
  //   intervalInDays: 1,
  // },
  {
    categoryId: 121,
    startDate: new Date("2023-01-07"),
    intervalInDays: 1,
  },
];

export function getCategoriesThatShouldRunToday(
  categoriesSchedules = categoriesSchedules_
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

export function returnNow() {
  return Date.now();
}

export function getSchedule() {
  return categoriesSchedules_;
}
