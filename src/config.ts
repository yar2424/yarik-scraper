import { ScrapperAfm } from "./scrappers/scrapperAfm.js";
import { ScrapperAllSpares } from "./scrappers/scrapperAllSpares.js";
import { ScrapperArtMobile } from "./scrappers/scrapperArtMobile.js";
import { ScrapperFlatCable } from "./scrappers/scrapperFlatCable.js";
import { ScrapperTPlus } from "./scrappers/scrapperTPlus.js";
import { ScrapperUptel } from "./scrappers/scrapperUptel.js";
import { IScheduleItemp, IScrappersInfo } from "./types";

import fs from "fs";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

interface IConfig {
  scrappersToRun: IScrappersInfo[];
  schedule: IScheduleItemp[];
  outputFileKey: string;
  shopsCredentials: IShopsCredentials;
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

const getMainConfig = async (): Promise<IConfig> => {
  const shopsCredentials = await getShopsCredentialsFromS3(
    "parser-yarik",
    "shopsCredentials.json"
  );
  return {
    scrappersToRun: [
      { name: "Afm", class_: ScrapperAfm },
      { name: "AllSpares", class_: ScrapperAllSpares },
      { name: "ArtMobile", class_: ScrapperArtMobile },
      { name: "FlatCable", class_: ScrapperFlatCable },
      { name: "TPlus", class_: ScrapperTPlus },
      { name: "Uptel", class_: ScrapperUptel },
    ],
    schedule: [
      {
        categoryId: 121,
        startDate: new Date("2023-01-30"),
        intervalInDays: 3,
      },
    ],
    outputFileKey: "parsing-results/outputXml.xml",
    shopsCredentials,
  };
};

const getDevConfig = async (): Promise<IConfig> => {
  const shopsCredentials = await getShopsCredentialsFromS3(
    "parser-yarik",
    "shopsCredentials.json"
  );
  return {
    scrappersToRun: [
      { name: "Afm", class_: ScrapperAfm },
      // { name: "AllSpares", class_: ScrapperAllSpares },
      { name: "ArtMobile", class_: ScrapperArtMobile },
      { name: "FlatCable", class_: ScrapperFlatCable },
      { name: "TPlus", class_: ScrapperTPlus },
      { name: "Uptel", class_: ScrapperUptel },
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
    shopsCredentials,
  };
};

const getLocalCredentialsConfig = (configFilePath: string) => {
  const contents = fs.readFileSync(configFilePath).toString();
  return JSON.parse(contents);
};

const localConfig: IConfig = {
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
  shopsCredentials: getLocalCredentialsConfig(
    "/Users/philip/Documents/projects/parser/src/shopsCredentials.json"
  ),
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
  } else {
    config = localConfig;
  }
};
