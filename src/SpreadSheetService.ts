import Sheet = GoogleAppsScript.Spreadsheet.Sheet
import Range = GoogleAppsScript.Spreadsheet.Range
import { Locale } from "./datas";

export interface SpreadSheetService {
  getUserLocale: () => Locale
  getUserProperty: (key: string) => string
  setUserProperty: (key: string, value: string) => void
  getRange: (sheet: Sheet, column: number, row: number) => Range
  showMessage: (title: string, message: string) => void
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

  public getRange(sheet: Sheet, column: number, row: number): Range {
    return sheet.getRange(row, column)
  }

  public showMessage(title: string, message: string): void {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, title)
  }

}
