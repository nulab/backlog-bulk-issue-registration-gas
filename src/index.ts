import UiInstance = GoogleAppsScript.UI.UiInstance
import Grid = GoogleAppsScript.UI.Grid
import {BacklogClient, BacklogClientImpl} from "./BacklogClient"
import {Key, Project, Issue, Id, BacklogDefinition, Locale, UserProperty, User} from "./datas"
import {HttpClient} from "./Http"
import {Option, Some, None} from "./Option"
import {Either, Right, Left} from "./Either"
import {IssueConverter} from "./IssueConverter"
import {List} from "./List"
import { Message } from "./resources";
import { SpreadSheetService, SpreadSheetServiceImpl } from "./SpreadSheetService";

const SCRIPT_VERSION = "v2.0.0-SNAPSHOT"
const TEMPLATE_SHEET_NAME = "Template"
const ROW_HEADER_INDEX = 1

declare var global: any

type Validation<A> = (a: A, onError: Error) => Either<Error, A>

const isEmpty: Validation<string> = (str: string, onError: Error): Either<Error, string> =>
  str !== "" ? Right(str) : Left(onError)

const createBacklogClient = (space: string, domain: string, apiKey: string, locale: Locale): Either<Error, BacklogClient> => {
  const spaceResult = isEmpty(space, Error(Message.SPACE_URL_REQUIRED(locale)))
  const apiKeyResult = isEmpty(apiKey, Error(Message.API_KEY_REQUIRED(locale)))
  return Either.map2(spaceResult, apiKeyResult, (s, a) => {
    return Right(new BacklogClientImpl(new HttpClient, s, domain, a))
  })
}

const getProject = (client: BacklogClient, key: Key<Project>, locale: Locale): Either<Error, Project> => {
  const result = client.getProjectV2(key)
  return result.recover(error => {
    if (error.message.indexOf("returned code 404") !== -1)
      return Left(Error(Message.SPACE_OR_PROJECT_NOT_FOUND(locale)))
    if (error.message.indexOf("returned code 401") !== -1)
      return Left(Error(Message.AUTHENTICATE_FAILED(locale)))
    return Left(Error(Message.API_ACCESS_ERROR(error, locale)))
  })
}

const createIssueConverter = (client: BacklogClient, projectId: Id<Project>): IssueConverter =>
  IssueConverter(
    projectId,
    client.getIssueTypesV2(projectId),
    client.getCategoriesV2(projectId),
    client.getVersionsV2(projectId),
    client.getPrioritiesV2(),
    client.getUsersV2(projectId),
    client.getCustomFieldsV2(projectId)
  )

const convertIssue = (converter: IssueConverter, issue: any): Either<Error, Issue> =>
  converter.convert(issue)

const validate = (issues: List<any>, client: BacklogClient, locale: Locale): Either<Error, boolean> => {
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i]
    const errorString = Message.VALIDATE_ERROR_LINE(i + 2, locale)
    if (!Option(issue.summary).isDefined)
      return Left(Error(errorString + Message.VALIDATE_SUMMARY_EMPTY(locale)))
    if (!Option(issue.issueTypeName).isDefined)
      return Left(Error(errorString + Message.VALIDATE_ISSUE_TYPE_EMPTY(locale)))
    if (issue.parentIssueKey !== undefined && issue.parentIssueKey !== "*")
      if (!client.getIssueV2(issue.parentIssueKey).isDefined)
        return Left(Error(errorString + Message.VALIDATE_PARENT_ISSUE_KEY_NOT_FOUND(issue.parentIssueKey, locale)))
  }
  return Right(true)
}

const getMessage = (key: string, spreadSheetService: SpreadSheetService) =>
  Message.findByKey(key, spreadSheetService.getUserLocale())

const getUserProperties = (spreadSheetService: SpreadSheetService): UserProperty => {
  const lastSpace = spreadSheetService.getUserProperty("space") ? spreadSheetService.getUserProperty("space") : ""
  const lastDomain = spreadSheetService.getUserProperty("domain") ? spreadSheetService.getUserProperty("domain") : ".com"
  const lastApiKey = spreadSheetService.getUserProperty("apikey") ? spreadSheetService.getUserProperty("apikey") : ""
  const lastProjectKey = spreadSheetService.getUserProperty("projectKey") ? spreadSheetService.getUserProperty("projectKey") : ""

  return UserProperty(lastSpace, lastDomain, lastApiKey, lastProjectKey)
}

const storeUserProperties = (property: UserProperty, spreadSheetService: SpreadSheetService): void => {
  spreadSheetService.setUserProperty("space", property.space)
  spreadSheetService.setUserProperty("domain", property.domain)
  spreadSheetService.setUserProperty("apikey", property.apiKey);
  spreadSheetService.setUserProperty("projectKey", property.projectKey);
}

const showMessage = (message: string, spreadSheetService: SpreadSheetService): void =>
  spreadSheetService.showMessage(getMessage("scriptName", spreadSheetService), message)

export const createIssue = (client: BacklogClient, issue: Issue, optParentIssueId: Option<string>): Either<Error, Issue> => {
  const createIssue = Issue(
    0,
    "",
    issue.projectId,
    issue.summary,
    issue.description,
    issue.startDate,
    issue.dueDate,
    issue.estimatedHours,
    issue.actualHours,
    issue.issueType,
    issue.categories,
    issue.versions,
    issue.milestones,
    issue.priority,
    issue.assignee,
    optParentIssueId.map(id => id.toString()),
    issue.customFields
  )

  return client.createIssueV2(createIssue)
}

interface BacklogScript {

  createApplication: (title: string, width: number, height: number) => UiInstance

  createGrid: (ui: UiInstance, property: UserProperty) => Grid

  showDialog: (ui: UiInstance, grid: Grid, handlerName: string) => void

  showInitDialog: () => void

  showRunDialog: () => void

  getUserProperties: () => UserProperty

  storeUserProperties: (property: UserProperty) => void

  run: (space: string, domain: string, apiKey: string, key: Key<Project>, rawIssues: List<any>, onSuccess: (i: number, issue: Issue) => void, onWarn: (message: string) => void) => void

  getDefinitions: () => UiInstance

  definitions: (space: string, domain: string, apiKey: string, key: Key<Project>) => BacklogDefinition

  getMessage: (key: string, locale: string) => string

  showMessage: (message: string) => void
}

const BacklogScript = (spreadSheetService: SpreadSheetService): BacklogScript => ({

  createApplication: (title: string, width: number, height: number): UiInstance =>
    UiApp
      .createApplication()
      .setTitle(title)
      .setWidth(width)
      .setHeight(height),

  createGrid: (ui: UiInstance, property: UserProperty): Grid => {
    const anotherDomain = (property.domain === ".com") ? ".jp" : ".com"
    return ui
      .createGrid(3, 4)
      .setWidget(0, 0, ui.createLabel(getMessage("label_spaceId", spreadSheetService)))
      .setWidget(0, 1, ui.createTextBox().setName("space").setValue(property.space))
      .setWidget(0, 2, ui.createLabel('.backlog'))
      .setWidget(0, 3, ui.createListBox(false).setName("domain").addItem(property.domain).addItem(anotherDomain))
      .setWidget(1, 0, ui.createLabel(getMessage("label_apiKey", spreadSheetService)))
      .setWidget(1, 1, ui.createTextBox().setName("apikey").setValue(property.apiKey))
      .setWidget(2, 0, ui.createLabel(getMessage("label_projectKey", spreadSheetService)))
      .setWidget(2, 1, ui.createTextBox().setName("projectKey").setValue(property.projectKey))
  },

  showDialog(ui: UiInstance, grid: Grid, handlerName: string): void {
    const panel = ui.createVerticalPanel()
    const submitButton = ui.createButton(getMessage("button_execute", spreadSheetService))
    const submitHandler = ui.createServerClickHandler(handlerName)

    submitHandler.addCallbackElement(grid)
    submitButton.addBlurHandler(submitHandler)
    panel.add(grid).add(submitButton)
    ui.add(panel)
    SpreadsheetApp.getActiveSpreadsheet().show(ui)
  },

  showInitDialog(): void {
    const app = this.createApplication(getMessage("title_init", spreadSheetService) + " " + SCRIPT_VERSION, 360, 160)
    const property = this.getUserProperties()
    const grid = this.createGrid(app, property)
    
    this.showDialog(app, grid, "init_run_")
  },

  showRunDialog(): void {
    const app = this.createApplication(getMessage("title_run", spreadSheetService) + " " + SCRIPT_VERSION, 360, 160)
    const property = this.getUserProperties()
    const grid = this.createGrid(app, property)
    
    this.showDialog(app, grid, "main_run_")
  },

  getUserProperties: (): UserProperty =>
    getUserProperties(spreadSheetService),

  storeUserProperties: (property: UserProperty): void =>
    storeUserProperties(property, spreadSheetService),

  run: (space: string, domain: string, apiKey: string, key: Key<Project>, rawIssues: List<any>, onSuccess: (i: number, issue: Issue) => void, onWarn: (message: string) => void): void => {
    const locale = spreadSheetService.getUserLocale()
    const client = createBacklogClient(space, domain, apiKey, locale).getOrError()
    const _ = validate(rawIssues, client, locale).getOrError()
    const project = getProject(client, key, locale).getOrError()
    const converter = createIssueConverter(client, project.id)
    const convertResults = rawIssues.map(issue => convertIssue(converter, issue))
    const issues = Either.sequence(convertResults).getOrError()

    // Post issues
    let previousIssue = Option<Issue>(null)
    for ( let i = 0; i < issues.length; i++) {
      let isTakenOverParentIssueId = false
      let optParentIssueId = issues[i].parentIssueId

      optParentIssueId.map(function(parentIssueId) {
        if (parentIssueId === "*") {
          if (previousIssue.flatMap(issue => issue.parentIssueId).isDefined) {
            previousIssue.map(issue => onWarn(Message.ALREADY_BEEN_CHILD_ISSUE(issue.issueKey, locale)))
            optParentIssueId = None<string>()
          } else {
            optParentIssueId = previousIssue.map(issue => issue.id.toString())
            isTakenOverParentIssueId = true
          }
        } else {
          optParentIssueId = client.getIssueV2(parentIssueId).map(issue => issue.id)
        }
      })
      createIssue(client, issues[i], optParentIssueId.map(id => id)).map(issue => {
        if (!isTakenOverParentIssueId) {
          previousIssue = Some(issue)
        }
        onSuccess(i, issue)
      }).getOrError()
    }
  },

  getDefinitions: (): UiInstance => {
    const app = UiApp.getActiveApplication()
    const property = getUserProperties(spreadSheetService)
    const locale = spreadSheetService.getUserLocale()
    
    storeUserProperties(property, spreadSheetService)
    return createBacklogClient(property.space, property.domain, property.apiKey, locale)
      .flatMap(client =>
        getProject(client, property.projectKey, locale).map(project => 
          BacklogDefinition(
            client.getIssueTypesV2(project.id),
            client.getCategoriesV2(project.id),
            client.getVersionsV2(project.id),
            client.getPrioritiesV2(),
            client.getUsersV2(project.id),
            client.getCustomFieldsV2(project.id)
          )
        )
      )
      .map(definition => {
        const templateSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEMPLATE_SHEET_NAME)
        const issueTypeRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.issueTypeNames(), true).build()
        const categoryRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.categoryNames(), true).build()
        const versionRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.versionNames(), true).build()
        const priorityRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.priorityNames(), true).build()
        const userRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.userNames(), true).build()
        const lastRowNumber = templateSheet.getLastRow() - 1
        const customFieldStartColumnNumber = 14 // N ~
        let currentColumnNumber = customFieldStartColumnNumber

        templateSheet.getRange(2, 7, lastRowNumber).setDataValidation(issueTypeRule)  // 7 = G
        templateSheet.getRange(2, 8, lastRowNumber).setDataValidation(categoryRule) 	// 8 = H
        templateSheet.getRange(2, 9, lastRowNumber).setDataValidation(versionRule) 	  // 9 = I
        templateSheet.getRange(2, 10, lastRowNumber).setDataValidation(versionRule) 	// 10 = J
        templateSheet.getRange(2, 11, lastRowNumber).setDataValidation(priorityRule)  // 11 = K
        templateSheet.getRange(2, 12, lastRowNumber).setDataValidation(userRule) 	    // 12 = L
        for (let i = 0; i < definition.customFields.length; i++) {
          const customField = definition.customFields[i]
          const headerCell = spreadSheetService.getRange(templateSheet, currentColumnNumber, ROW_HEADER_INDEX)
          const columnName = headerCell.getValue()
      
          /**
           * https://github.com/nulab/backlog4j/blob/master/src/main/java/com/nulabinc/backlog4j/CustomField.java#L10
           * Text(1), TextArea(2), Numeric(3), Date(4), SingleList(5), MultipleList(6), CheckBox(7), Radio(8)
           * We don't support the types MultipleList(6) and CheckBox(7), Radio(8)
           */
          var customFieldName = "";
      
          if (customField.typeId >= 6)
            continue;
          switch(customField.typeId) {
            case 1:
              customFieldName = "文字列";
              break;
            case 2:
              customFieldName = "文章";
              break;
            case 3:
              customFieldName = "数値";
              break;
            case 4:
              customFieldName = "日付";
              break;
            case 5:
              customFieldName = "選択リスト";
              break;
          }
          if (columnName === "") {
            templateSheet.insertColumnAfter(currentColumnNumber - 1);
            templateSheet
              .getRange(1, currentColumnNumber, templateSheet.getLastRow(), 1)
              .setBackground("#F8FFFF")
              .setFontColor("black");
          }
          headerCell.setFormula(
            '=hyperlink("' + property.space + ".backlog" + property.domain + "/EditAttribute.action?attribute.id=" + customField.id + '";"' + customField.name + '（' + customFieldName + '）' + '")'
          )
          currentColumnNumber++
        }
        showMessage(getMessage("complete_init", spreadSheetService), spreadSheetService)
        return app.close()
      })
      .getOrError()
  },

  definitions: (space: string, domain: string, apiKey: string, key: Key<Project>): BacklogDefinition => {
    const locale = spreadSheetService.getUserLocale()
    const client = createBacklogClient(space, domain, apiKey, locale).getOrError()
    const project = getProject(client, key, locale).getOrError()

    return BacklogDefinition(
      client.getIssueTypesV2(project.id),
      client.getCategoriesV2(project.id),
      client.getVersionsV2(project.id),
      client.getPrioritiesV2(),
      client.getUsersV2(project.id),
      client.getCustomFieldsV2(project.id)
    )
  },

  getMessage: (key: string): string =>
    getMessage(key, spreadSheetService),

  showMessage: (message: string): void =>
    showMessage(message, spreadSheetService)
});

(global as any).BacklogScript = BacklogScript(new SpreadSheetServiceImpl)
