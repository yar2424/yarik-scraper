import { ScrapperAfm } from "./scrappers/scrapperAfm.js";
import { ScrapperAllSpares } from "./scrappers/scrapperAllSpares.js";
import { ScrapperArtMobile } from "./scrappers/scrapperArtMobile.js";
import { ScrapperFlatCable } from "./scrappers/scrapperFlatCable.js";
import { ScrapperTPlus } from "./scrappers/scrapperTPlus.js";
import { ScrapperUptel } from "./scrappers/scrapperUptel.js";
import {
  IScheduleItem,
  IScheduleItemFromDynamo,
  IScrappersInfo,
  Shop,
} from "./types";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

import fs from "fs";
import { BaseScrapper } from "./scrappers/baseScrapper.js";
import { IItem } from "./crmXmlHelper.js";

interface IConfigFromDynamo {
  scrappersToRun: Shop[];
  schedule: IScheduleItemFromDynamo[];
}

interface IConfig {
  scrappersToRun: IScrappersInfo[];
  schedule: IScheduleItem[];
  outputFileKey: string;
  shopsCredentials: IShopsCredentials;
  dynamodbProgressItemKey?: string;
}

interface IShopsCredentials {
  usernameAfm: string;
  passwordAfm: string;
  usernameAllSpares: string;
  passwordAllSpares: string;
  usernameArtMobile: string;
  passwordArtMobile: string;
  usernameFlatCable: string;
  passwordFlatCable: string;
  usernameTPlus: string;
  passwordTPlus: string;
  usernameUptel: string;
  passwordUptel: string;
}

const getShopsCredentialsFromS3 = async (bucket: string, fileKey: string) => {
  const objectInfo = {
    Bucket: bucket,
    Key: fileKey,
  };
  try {
    const s3ClientConfig = {
      region: "eu-central-1",
    };
    const s3Client = new S3Client(s3ClientConfig);
    const data = await s3Client.send(new GetObjectCommand(objectInfo));
    if (data.Body === undefined) {
      throw new Error(`Failed to download ${objectInfo} from s3.`);
    }
    const contents = await data.Body.transformToString();
    return JSON.parse(contents);
  } catch (error) {
    console.log("CRITICAL Failed to load shops credentials config from s3");
  }
};

export const getConfigPartStoredInDynamodb = async (
  configKey: string
): Promise<IConfigFromDynamo> => {
  const ddbClient = new DynamoDBClient({});

  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

  const params = {
    TableName: "YarikScrapper",
    Key: {
      PK: configKey,
    },
  };

  const getItem = async () => {
    try {
      const data = await ddbDocClient.send(new GetCommand(params));
      return data.Item;
    } catch (err) {
      console.log("Error", err);
    }
  };
  const item: any = (await getItem()) as unknown as IConfigFromDynamo;
  const jsonString = item.Value;
  const configObject = JSON.parse(jsonString);

  return configObject;
};

const instantiateConfigFromDynamodb = async (
  configKey: string
): Promise<IConfig> => {
  const shopsCredentials = await getShopsCredentialsFromS3(
    "parser-yarik",
    "shopsCredentials.json"
  );

  const configFromDynamodb = await getConfigPartStoredInDynamodb(configKey);

  const scrappersToRun = configFromDynamodb.scrappersToRun.map((shopName) => ({
    name: shopName,
    class_: shopNameToScrapperClassMap[shopName],
  }));

  const schedule = configFromDynamodb.schedule.map((scheduleItem) => ({
    categoryId: scheduleItem.categoryId,
    startDate: new Date(scheduleItem.startDate),
    intervalInDays: scheduleItem.intervalInDays,
  }));

  return {
    scrappersToRun,
    schedule,
    outputFileKey: "parsing-results/outputXml.xml",
    shopsCredentials,
  };
};

const shopNameToScrapperClassMap: {
  [key in Shop]: typeof BaseScrapper<IItem>;
} = {
  Afm: ScrapperAfm,
  AllSpares: ScrapperAllSpares,
  ArtMobile: ScrapperArtMobile,
  FlatCable: ScrapperFlatCable,
  TPlus: ScrapperTPlus,
  Uptel: ScrapperUptel,
};

export const getMainConfig = async (): Promise<IConfig> => {
  return instantiateConfigFromDynamodb("config-main");
};

const getDevConfig = async (): Promise<IConfig> => {
  return instantiateConfigFromDynamodb("config-dev");
};

const getManualRunConfig = async (): Promise<IConfig> => {
  let config = await instantiateConfigFromDynamodb("config-manual-run");
  config = {
    ...config,
    dynamodbProgressItemKey: "manual-run",
  };
  return config;
};

const getLocalCredentials = (filePath: string) => {
  const contents = fs.readFileSync(filePath).toString();
  return JSON.parse(contents);
};

const getLocalConfig = (): IConfig => {
  return {
    scrappersToRun: [
      { name: "Afm", class_: ScrapperAfm },
      // { name: "AllSpares", class_: ScrapperAllSpares },
      // { name: "ArtMobile", class_: ScrapperArtMobile },
      // { name: "FlatCable", class_: ScrapperFlatCable },
      // { name: "TPlus", class_: ScrapperTPlus },
      // { name: "Uptel", class_: ScrapperUptel },
    ],
    schedule: [
      // {
      //   categoryId: 54,
      //   startDate: new Date("2023-01-10"),
      //   intervalInDays: 1,
      // },
      {
        categoryId: 121,
        startDate: new Date("2023-01-28"),
        intervalInDays: 1,
      },
    ],
    outputFileKey: "parsing-results/outputXml.xml",
    shopsCredentials: getLocalCredentials(
      "/Users/philip/Documents/projects/parser/src/shopsCredentials.json"
    ),
  };
};

export let config: IConfig;

export const instantiateConfig = async () => {
  console.log(
    `INFO Instantiating config for NODE_ENV: "${process.env.NODE_ENV}"`
  );
  if (process.env.NODE_ENV === "main") {
    config = await getMainConfig();
  } else if (process.env.NODE_ENV === "dev") {
    config = await getDevConfig();
  } else if (process.env.NODE_ENV === "manual-run") {
    config = await getManualRunConfig();
  } else {
    config = getLocalConfig();
  }
};
