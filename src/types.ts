export type Shop =
  | "ArtMobile"
  | "TPlus"
  | "Afm"
  | "Uptel"
  | "FlatCable"
  | "AllSpares";

export interface IScrappersInfo {
  name: Shop;
  class_: any;
}

export interface IScheduleItemFromDynamo {
  categoryId: number;
  startDate: string;
  intervalInDays: number;
}

export interface IScheduleItem {
  categoryId: number;
  startDate: Date;
  intervalInDays: number;
}

export type Stock = "В наличии" | "Нет в наличии" | "failed to scrap";
