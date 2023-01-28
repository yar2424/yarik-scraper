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

export interface IScheduleItemp {
  categoryId: number;
  startDate: Date;
  intervalInDays: number;
}
