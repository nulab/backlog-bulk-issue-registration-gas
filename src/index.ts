import {BacklogService} from "./BacklogService"
import {SpreadSheetServiceImpl} from "./SpreadSheetService"

declare var global: any

const SCRIPT_VERSION = "v2.0.5-SNAPSHOT"

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
          functionName: "main_d"
        }
      ]
    )
}

global.init_d = function () {
  const html = HtmlService.createTemplateFromFile("index") as any

  html.mode = "init"
  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html.evaluate(),
      this.BacklogService.getMessage("title_init") + " " + SCRIPT_VERSION
    )
}

global.main_d = function () {
  const html = HtmlService
    .createTemplateFromFile("execute")
    .evaluate()

  SpreadsheetApp
    .getUi()
    .showModalDialog(html, this.BacklogService.getMessage("title_run") + " " + SCRIPT_VERSION)
}

global.init = function (grid: any) {
  this.BacklogService.init(grid)
}

global.main = function (grid: any) {
  this.BacklogService.run(grid)
}

global.getConfig = function () {
  return this.BacklogService.getUserProperties()
}

global.include = function include(filename: string) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}
