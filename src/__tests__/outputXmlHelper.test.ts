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
