import { XMLParser } from "fast-xml-parser";
import axios from "axios";

export class InputXmlHelper {
  constructor(
    public itemsHelper: ItemsHelper,
    public categoriesHelper: CategoriesHelper
  ) {}

  static async instantiateWithCrmData(
    xmlUrl = "https://partstore.crm-onebox.com/media/export/product/newfeedprice.xml"
  ) {
    const res = await axios.get(xmlUrl);
    const xmlString = await res.data;

    const options = { ignoreDeclaration: true };
    const parser = new XMLParser(options);
    const parsed = parser.parse(xmlString);

    const itemsHelper = new ItemsHelper(parsed.rss.channel.item);
    const categoriesHelper = new CategoriesHelper(
      parsed.rss.categories.category
    );

    return new InputXmlHelper(itemsHelper, categoriesHelper);
  }

  getAllItems() {
    return this.itemsHelper.items;
  }

  getItemsByCategoriesIds(ids: number[]) {
    return this.itemsHelper.getItemsByCategoriesIds(ids);
  }

  getItemsThatAreChildrenOfCategory(categoryId: number) {
    const childrenCategoriesIds =
      this.categoriesHelper.getChildrenIdsRecursively(categoryId);
    return this.itemsHelper.getItemsByCategoriesIds(childrenCategoriesIds);
  }

  getItemsThatAreChildrenOfCategories(categoriesIds: number[]) {
    const childrenCategoriesIds = categoriesIds.reduce(
      (acc, categoryId) => [
        ...acc,
        ...this.categoriesHelper.getChildrenIdsRecursively(categoryId),
      ],
      [] as number[]
    );
    return this.itemsHelper.getItemsByCategoriesIds(childrenCategoriesIds);
  }
}

export interface ICategory {
  "g:category_id": number;
  "g:category_name": string;
  "g:parent_category_id": number;
}

export class CategoriesHelper {
  constructor(public categories: ICategory[]) {}

  getCategoryById(categoryId: number): ICategory {
    const category = this.categories.find((category) => {
      return category["g:category_id"] === categoryId;
    });
    if (category === undefined) {
      throw new Error(
        "Category was not found. Likely invalid 'categoryId' was passed."
      );
    }
    return category;
  }

  getCategoriesByParrentId(parrentId: number): ICategory[] {
    return this.categories.filter((category) => {
      return category["g:parent_category_id"] === parrentId;
    });
  }

  getChildrenIdsRecursively(parrentId: number): number[] {
    const recursiveChildrenIdsCollection = (startingId: number) => {
      const children = this.getCategoriesByParrentId(startingId);
      if (children.length === 0) return [];
      const collectedIds = children.map((child) => child["g:category_id"]);
      const returnedArraysFromFurtherChildren = collectedIds.map((id) =>
        recursiveChildrenIdsCollection(id)
      );
      const returnedFromFurtherChildrenOneArray =
        returnedArraysFromFurtherChildren.reduce(
          (acc, value) => [...acc, ...value],
          []
        );
      return [...collectedIds, ...returnedFromFurtherChildrenOneArray];
    };
    return [parrentId, ...recursiveChildrenIdsCollection(parrentId)];
  }
}

export interface IItem {
  "g:product_category": number;
  "g:product_category_name": string;
  "g:breadcrumbs": string;
  "g:brand": string;
  "g:mpn": string | number;
  Ssilkaartmobile: string;
  ssilkatekhno33: string;
  ssilkaAFM: string;
  ssilkaUptel: string;
  ssilkaFlatCable: string;
  ssilkaAllspares: string;
  ssilkaGsmForsage: string;
  ssilkaWelcomeMobi: string;
}

export class ItemsHelper {
  constructor(public items: IItem[]) {}

  getItemsByCategoriesIds(ids: number[]): IItem[] {
    return this.items.filter((item) =>
      ids.includes(item["g:product_category"])
    );
  }
}
