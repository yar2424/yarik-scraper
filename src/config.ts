import { ScrapperAfm } from "./scrappers/scrapperAfm.js";
import { ScrapperAllSpares } from "./scrappers/scrapperAllSpares.js";
import { ScrapperArtMobile } from "./scrappers/scrapperArtMobile.js";
import { ScrapperFlatCable } from "./scrappers/scrapperFlatCable.js";
import { ScrapperTPlus } from "./scrappers/scrapperTPlus.js";
import { ScrapperUptel } from "./scrappers/scrapperUptel.js";
import { IScheduleItemp, IScrappersInfo } from "./types";

interface IConfig {
  scrappersToRun: IScrappersInfo[];
  schedule: IScheduleItemp[];
  outputFileKey: string;
}

const mainConfig: IConfig = {
  scrappersToRun: [
    { name: "AllSpares", class_: ScrapperAllSpares },
    { name: "FlatCable", class_: ScrapperFlatCable },
    { name: "Uptel", class_: ScrapperUptel },
    { name: "Afm", class_: ScrapperAfm },
    { name: "ArtMobile", class_: ScrapperArtMobile },
    { name: "TPlus", class_: ScrapperTPlus },
  ],
  schedule: [
    {
      categoryId: 121,
      startDate: new Date("2023-01-30"),
      intervalInDays: 3,
    },
  ],
  outputFileKey: "parsing-results/outputXml.xml",
};

const devConfig: IConfig = {
  scrappersToRun: [
    // { name: "AllSpares", class_: ScrapperAllSpares },
    // { name: "FlatCable", class_: ScrapperFlatCable },
    // { name: "Uptel", class_: ScrapperUptel },
    { name: "Afm", class_: ScrapperAfm },
    // { name: "ArtMobile", class_: ScrapperArtMobile },
    // { name: "TPlus", class_: ScrapperTPlus },
  ],
  schedule: [
    {
      categoryId: 54,
      startDate: new Date("2023-01-10"),
      intervalInDays: 1,
    },
    // {
    //   categoryId: 121,
    //   startDate: new Date("2023-01-28"),
    //   intervalInDays: 1,
    // },
  ],
  outputFileKey: "parsing-results/out.xml",
};

export let config: IConfig;

if (process.env.NODE_ENV === "main") {
  config = mainConfig;
} else {
  config = devConfig;
}
