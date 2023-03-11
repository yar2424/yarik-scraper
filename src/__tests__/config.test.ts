import { getConfigPartStoredInDynamodb, getMainConfig } from "../config";
import { ScrapperAfm } from "../scrappers/scrapperAfm";

const mockConfigDynamodbParsed = {
  scrappersToRun: ["Afm"],
  schedule: [{ categoryId: 121, startDate: "2023-01-28", intervalInDays: 1 }],
};

const mockConfigProcessed = {
  scrappersToRun: [
    {
      name: "Afm",
      class_: ScrapperAfm,
    },
  ],
  schedule: [
    {
      categoryId: 121,
      startDate: new Date("2023-01-28"),
      intervalInDays: 1,
    },
  ],
};

test("Parse config from dynamodb", async () => {
  jest
    .spyOn(require("../config"), "getConfigFromDynamodb")
    .mockImplementation(() => Promise.resolve(mockConfigDynamodbParsed));

  expect(await getMainConfig()).toEqual(
    expect.objectContaining(mockConfigProcessed)
  );
  jest.resetAllMocks();
});
