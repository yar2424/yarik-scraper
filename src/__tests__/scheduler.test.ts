import {
  getCategoriesThatShouldRunToday,
  getSchedule,
  returnNow,
} from "../scheduler";

const mockCategoriesSchedules = [
  {
    categoryId: 54,
    startDate: new Date("2023-01-06"),
    intervalInDays: 3,
  },
];

beforeEach(() => {
  jest.restoreAllMocks();
});

test("Should run, same day", () => {
  const dateNowMock = jest
    .spyOn(Date, "now")
    .mockImplementation(() => new Date("2023-01-06").getTime());
  const categoriesThatShouldRun = getCategoriesThatShouldRunToday(
    mockCategoriesSchedules
  );
  expect(categoriesThatShouldRun.length).toBe(1);
  expect(categoriesThatShouldRun.includes(54)).toBe(true);
});

test("Should run, interval passed", () => {
  const dateNowMock = jest
    .spyOn(Date, "now")
    .mockImplementation(() => new Date("2023-01-09").getTime());
  const categoriesThatShouldRun = getCategoriesThatShouldRunToday(
    mockCategoriesSchedules
  );
  expect(categoriesThatShouldRun.length).toBe(1);
  expect(categoriesThatShouldRun.includes(54)).toBe(true);
});

test("Should run, 2 intervals passed", () => {
  const dateNowMock = jest
    .spyOn(Date, "now")
    .mockImplementation(() => new Date("2023-01-12").getTime());
  const categoriesThatShouldRun = getCategoriesThatShouldRunToday(
    mockCategoriesSchedules
  );
  expect(categoriesThatShouldRun.length).toBe(1);
  expect(categoriesThatShouldRun.includes(54)).toBe(true);
});

test("Shouldn't run", () => {
  const dateNowMock = jest
    .spyOn(Date, "now")
    .mockImplementation(() => new Date("2023-01-07").getTime());
  const categoriesThatShouldRun = getCategoriesThatShouldRunToday(
    mockCategoriesSchedules
  );
  expect(categoriesThatShouldRun.length).toBe(0);
});

test("Shouldn't run", () => {
  const dateNowMock = jest
    .spyOn(Date, "now")
    .mockImplementation(() => new Date("2023-01-08").getTime());
  const categoriesThatShouldRun = getCategoriesThatShouldRunToday(
    mockCategoriesSchedules
  );
  expect(categoriesThatShouldRun.length).toBe(0);
});

test("Shouldn't run", () => {
  const dateNowMock = jest
    .spyOn(Date, "now")
    .mockImplementation(() => new Date("2023-01-10").getTime());
  const categoriesThatShouldRun = getCategoriesThatShouldRunToday(
    mockCategoriesSchedules
  );
  expect(categoriesThatShouldRun.length).toBe(0);
});
