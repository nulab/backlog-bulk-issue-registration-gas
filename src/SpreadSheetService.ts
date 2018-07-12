import { Locale } from "./datas";

export interface SpreadSheetService {
  getUserLocale: () => Locale
  getUserProperty: (key: string) => string
  setUserProperty: (key: string, value: string) => void
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

  public getUserProperty(key: string): string {
    return PropertiesService.getUserProperties().getProperty("bti." + key)
  }

  public setUserProperty(key: string, value: string): void {
    PropertiesService.getUserProperties().setProperty("bti." + key, value)
  }

}
