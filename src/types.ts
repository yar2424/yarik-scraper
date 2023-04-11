export type Shop =
  | "ArtMobile"
  | "TPlus"
  | "Afm"
  | "Uptel"
  | "FlatCable"
  | "AllSpares"
  | "GsmForsage"
  | "WelcomeMobi";

export interface IScrappersInfo {
  name: Shop;
  class_: any;
}

export interface IScheduleItemp {
  categoryId: number;
  startDate: Date;
  intervalInDays: number;
}

export type Stock = "В наличии" | "Нет в наличии" | "failed to scrap";
