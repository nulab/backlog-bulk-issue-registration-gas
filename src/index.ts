import {BacklogService} from "./BacklogService"
import {SpreadSheetServiceImpl} from "./SpreadSheetService"
import {UserProperty} from "./datas"

declare var global: any

const SCRIPT_VERSION = "v2.1.0"

global.BacklogService = BacklogService(new SpreadSheetServiceImpl)

global.onOpen = function() {
  SpreadsheetApp.getActiveSpreadsheet()
    .addMenu(
      "Backlog",
      [
        {
          name : this.BacklogService.getMessage("menu_step1"),
          functionName: "init_d"
        },
        {
          name : this.BacklogService.getMessage("menu_step2"),
          functionName: "run_d"
        }
      ]
    )
}

global.init_d = function () {
  const html = HtmlService.createTemplateFromFile("index") as any

  html.mode = "init"
  SpreadsheetApp
    .getUi()
    .showModelessDialog(
      html.evaluate(),
      this.BacklogService.getMessage("title_init") + " " + SCRIPT_VERSION
    )
}

global.run_d = function () {
  const html = HtmlService.createTemplateFromFile("index") as any

  html.mode = "run"
  SpreadsheetApp
    .getUi()
    .showModelessDialog(
      html.evaluate(),
      this.BacklogService.getMessage("title_run") + " " + SCRIPT_VERSION
    )
}

global.init = function (property: UserProperty) {
  this.BacklogService.init(property)
}

global.run = function (property: UserProperty) {
  this.BacklogService.run(property)
}

global.getConfig = function () {
  return this.BacklogService.getUserProperties()
}

global.getMessage = function (key: string) {
  return this.BacklogService.getMessage(key)
}

global.include = function include(filename: string) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}
