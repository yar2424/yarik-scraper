import { IItem } from "../crmXmlHelper";
import { OutputXmlHelper } from "../outputXmlHelper";
import itemsWithScrappedData from "../__mocks__/itemsWithScrappedData";

test("XmlOutputHelper is getting properly populated", () => {
  const outputXmlHelper = new OutputXmlHelper();
  outputXmlHelper.updatePricesForScrappedItems(
    itemsWithScrappedData as unknown as IItem[], // TODO create new type for parsed data that will not extend from IItem and will have links as optional. Or just add all links fields to mock object.
    "ArtMobile"
  );
  expect(outputXmlHelper.xmlItems.length).toBe(11);
});

test("Empty xmlItems array is created if specified s3 object doesn't exist", async () => {
  const outputXmlHelper = new OutputXmlHelper(
    "parser-yarik",
    "parsing-results/this-file-does-not-exist.xml"
  );
  await outputXmlHelper.loadXmlFromS3();
  expect(outputXmlHelper.xmlItems.length).toBe(0);
});

describe("addMissingFields methos tests", () => {
  let outputXmlHelper;

  beforeEach(() => {
    // populate almost empty outputXmlHelper
    outputXmlHelper = new OutputXmlHelper(
      "parser-yarik",
      "parsing-results/this-file-does-not-exist.xml"
    );
    outputXmlHelper.xmlItems = [{ code: "code", name: "name", stock_am: "ok" }];
  });

  test("Missing fields are being added", () => {
    outputXmlHelper.addMissingFields();
    const outputObjectKeys = Object.keys(outputXmlHelper.xmlItems[0]);
    expect(outputObjectKeys).toEqual(
      expect.arrayContaining(["price_am", "stock_fc"])
    );
  });

  test("Already present fields retain value", () => {
    outputXmlHelper.addMissingFields();
    const outputObjectKeys = Object.keys(outputXmlHelper.xmlItems[0]);
    const { stock_am, price_am } = outputXmlHelper.xmlItems[0];
    expect(stock_am).toBe("ok");
    expect(price_am).toBe("no link");
  });
});

test("Object fields are being sorted", () => {
  const outputXmlHelper = new OutputXmlHelper();
  outputXmlHelper.xmlItems = [
    {
      code: "code",
      name: "name",
      stock_am: "ok",
      price_am: "ok",
      last_updated_am: "ok",
    },
    {
      code: "code",
      name: "name",
      stock_am: "ko",
      price_am: "ko",
      last_updated_am: "ko",
    },
  ];
  outputXmlHelper.sortFields();
  console.log(outputXmlHelper.xmlItems);
  const outputObjectKeys = Object.keys(outputXmlHelper.xmlItems[0]);
  expect(outputObjectKeys).toEqual([
    "code",
    "last_updated_am",
    "name",
    "price_am",
    "stock_am",
  ]);
});
