import { XMLBuilder, XMLParser } from "fast-xml-parser";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { IItem } from "./crmXmlHelper";
import { Shop } from "./types";

const s3ClientConfig = {
  region: "eu-central-1",
};
const s3Client = new S3Client(s3ClientConfig);

interface IOutputXmlItem {
  code: string | number;
  name: string;
  price_am?: string;
  stock_am?: string;
  last_updated_am?: string;
}

export class OutputXmlHelper {
  shopFieldNamesMappings: { [key in Shop]: string[] };

  constructor(
    public xmlS3Bucket = "parser-yarik",
    public xmlS3Key = "parsing-results/outputXml.xml",
    public xmlItems: IOutputXmlItem[] = []
  ) {
    this.shopFieldNamesMappings = {
      ArtMobile: ["price_am", "stock_am", "last_updated_am"],
      TPlus: ["price_tp", "stock_tp", "last_updated_tp"],
      Afm: ["price_afm", "stock_afm", "last_updated_afm"],
      Uptel: ["price_uptel", "stock_uptel", "last_updated_uptel"],
      FlatCable: ["price_fc", "stock_fc", "last_updated_fc"],
      AllSpares: ["price_as", "stock_as", "last_updated_as"],
      GsmForsage: ["price_forsage", "stock_forsage", "last_updated_forsage"],
      WelcomeMobi: ["price_wm", "stock_wm", "last_updated_wm"],
      Displayko: [
        "price_displayko",
        "stock_displayko",
        "last_updated_displayko",
      ],
    };
  }

  parseXmlString(xmlString: string) {
    const parserOptions = { ignoreDeclaration: true };
    const parser = new XMLParser(parserOptions);
    const parsed = parser.parse(xmlString);
    return parsed;
  }

  async loadXmlFromS3() {
    const objectInfo = {
      Bucket: this.xmlS3Bucket,
      Key: this.xmlS3Key,
    };
    try {
      const data = await s3Client.send(new GetObjectCommand(objectInfo));
      if (data.Body === undefined) {
        throw new Error(`Failed to download ${objectInfo} from s3.`);
      }

      const xmlString = await data.Body.transformToString();

      const parsed = this.parseXmlString(xmlString);

      this.xmlItems = parsed.mobile_parts.storage.item;
    } catch (error) {
      console.log("WARNING Failed to load xml from s3, will create new one.");
      this.xmlItems = [];
    }
  }

  getItemByCode(code: string | number): IOutputXmlItem | undefined {
    return this.xmlItems.find((item) => item.code === code);
  }

  getItemIndexByCode(code: string | number): number {
    return this.xmlItems.findIndex((item) => item.code === code);
  }

  putItemIntoItems(item: IOutputXmlItem) {
    const index = this.getItemIndexByCode(item.code);
    if (index !== -1) {
      this.xmlItems[index] = item;
    } else {
      this.xmlItems.push(item);
    }
  }

  updatePriceForScrappedItem(scrappedItem: IItem, shop: Shop) {
    let itemToUpdate = this.getItemByCode(scrappedItem["g:mpn"]);
    if (itemToUpdate === undefined) {
      itemToUpdate = {
        code: scrappedItem["g:mpn"],
        name:
          scrappedItem["g:breadcrumbs"].split(" - ").pop() ||
          scrappedItem["g:breadcrumbs"],
      };
    }
    const fieldsToUpdate = this.shopFieldNamesMappings[shop];
    for (let fieldName of fieldsToUpdate) {
      itemToUpdate[fieldName] = scrappedItem[fieldName];
    }
    this.putItemIntoItems(itemToUpdate);
  }

  updatePricesForScrappedItems(scrappedItems: IItem[], shop: Shop) {
    for (let scrappedItem of scrappedItems) {
      this.updatePriceForScrappedItem(scrappedItem, shop);
    }
  }

  addMissingFields() {
    const fieldsArrays = Object.values(this.shopFieldNamesMappings);
    const fields = fieldsArrays.reduce((acc, cur) => [...acc, ...cur], []);
    this.xmlItems = this.xmlItems.map((item) => {
      fields.forEach((fieldName) => {
        item[fieldName] = item[fieldName] ?? "no link";
      });
      return item;
    });
  }

  removeExtraFields() {
    const fieldsArrays = Object.values(this.shopFieldNamesMappings);
    let allowedFields = fieldsArrays.reduce((acc, cur) => [...acc, ...cur], []);
    allowedFields = allowedFields.concat(["code", "name"]);
    this.xmlItems = this.xmlItems.map((item) => {
      const filteredObj = {};
      for (const key in item) {
        if (allowedFields.includes(key)) {
          filteredObj[key] = item[key];
        }
      }
      return filteredObj as IOutputXmlItem;
    });
  }

  sortFields() {
    this.xmlItems = this.xmlItems.map((unordered) => {
      const ordered = Object.keys(unordered)
        .sort()
        .reduce((obj, key) => {
          obj[key] = unordered[key];
          return obj;
        }, {});
      return ordered as IOutputXmlItem;
    });
  }

  generateXmlStringFromXmlItems(xmlItems: IOutputXmlItem[]): string {
    const outputXmlJSObject = {
      mobile_parts: {
        storage: {
          item: xmlItems,
        },
      },
    };
    const options = {
      ignoreAttributes: false,
      suppressEmptyNode: true,
    };
    const builder = new XMLBuilder(options);
    let xmlString = builder.build(outputXmlJSObject);
    xmlString = '<?xml version="1.0" encoding="utf-8"?>' + xmlString;
    return xmlString;
  }

  async uploadXMLToS3() {
    const fileContents = this.generateXmlStringFromXmlItems(this.xmlItems);
    const objectInfo = {
      Bucket: this.xmlS3Bucket,
      Key: this.xmlS3Key,
      Body: fileContents,
    };

    const data = await s3Client.send(new PutObjectCommand(objectInfo));
    return data;
  }
  async uploadXMLToS3InParts(maxItemsPerFile: number) {
    let chunked: IOutputXmlItem[][] = [];
    for (let i = 0; i < this.xmlItems.length; i += maxItemsPerFile) {
      chunked.push(this.xmlItems.slice(i, i + maxItemsPerFile));
    }
    const filesContents = chunked.map((value) => {
      return this.generateXmlStringFromXmlItems(value);
    });
    for (let i = 0; i < filesContents.length; i += 1) {
      function getS3KeyForChunk(chunk: number, baseKey: string): string {
        const parts = baseKey.split(".");
        let mainPart: string = "";
        if (parts.length > 1) {
          mainPart = parts.slice(0, -1).join(".");
        }
        const extension = parts[parts.length - 1];
        return mainPart + "-" + chunk + "." + extension;
      }

      const fileContents = filesContents[i];
      const objectInfo = {
        Bucket: this.xmlS3Bucket,
        Key: getS3KeyForChunk(i + 1, this.xmlS3Key),
        Body: fileContents,
      };

      const data = await s3Client.send(new PutObjectCommand(objectInfo));
    }
  }
}
