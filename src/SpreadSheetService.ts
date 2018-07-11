import { Locale } from "./datas";

export interface SpreadSheetService {
  getUserLocale: () => Locale
}

export class SpreadSheetServiceImpl implements SpreadSheetService {
  public getUserLocale(): Locale {
    switch(Session.getActiveUserLocale()) {
      case "ja":
        return "ja"
      default:
        return "en"
    }
  }
}