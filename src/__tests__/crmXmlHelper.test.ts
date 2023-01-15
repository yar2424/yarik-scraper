import sampleParsedObject from "../__mocks__/parsedCrmXml";

import { CategoriesHelper, IItem, ItemsHelper } from "../crmXmlHelper";

test("test tests", () => {
  expect(Object.keys(sampleParsedObject.rss)).toContain("categories");
  expect(Object.keys(sampleParsedObject.rss)).toContain("channel");
});

describe("Test CategoriesHelper", () => {
  test("Get category by id works", () => {
    const categoriesHelper = new CategoriesHelper(
      sampleParsedObject.rss.categories.category
    );
    const category = categoriesHelper.getCategoryById(121);
    expect(category["g:category_id"]).toBe(121);
    expect(category["g:category_name"]).toBe("Samsung");
    expect(category["g:parent_category_id"]).toBe(119);
  });

  test("Get categories by parrent id works", () => {
    const categoriesHelper = new CategoriesHelper(
      sampleParsedObject.rss.categories.category
    );
    const categories = categoriesHelper.getCategoriesByParrentId(0);
    expect(categories.length).toBe(4);
    const categoriesIds = categories.map(
      (category) => category["g:category_id"]
    );
    expect(categoriesIds).toContain(119);
    expect(categoriesIds).toContain(234);
    expect(categoriesIds).toContain(125);
    expect(categoriesIds).toContain(117);
  });

  test("Get children categories ids recursively works", () => {
    const categoriesHelper = new CategoriesHelper(
      sampleParsedObject.rss.categories.category
    );
    const categoriesIds = categoriesHelper.getChildrenIdsRecursively(119);
    expect(categoriesIds).toContain(119);
    expect(categoriesIds).toContain(121);
    expect(categoriesIds).toContain(25);
    expect(categoriesIds).toContain(170);
    expect(categoriesIds).not.toContain(234);
    expect(categoriesIds).not.toContain(125);
    expect(categoriesIds).not.toContain(117);
  });
});

describe("Test ItemsHelper", () => {
  test("Get items with the categeries' ids of interest", () => {
    const itemsHelper = new ItemsHelper(
      sampleParsedObject.rss.channel.item as unknown as IItem[]
    );
    const categoriesOfInterest = [119, 121, 25, 170];
    const itemsOfInterest =
      itemsHelper.getItemsByCategoriesIds(categoriesOfInterest);
    expect(itemsOfInterest.length).toBe(2);
    const mpns = itemsOfInterest.map((item) => item["g:mpn"]);
    const expectedMpns = ["GH82-23392A", "GH82-23561A"];
    expect(mpns).toEqual(expect.arrayContaining(expectedMpns));
  });
});
