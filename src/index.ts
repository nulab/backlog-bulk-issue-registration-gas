import {BacklogClient, BacklogClientImpl} from "./BacklogClient"
import {BacklogResult, User, IssueType, notNull, Key, Project, Issue} from "./datas"
import {Http, HttpClient} from "./Http"
import {Option} from "./Option"
import {Validation, ApiValidation} from "./ApiValidation"
import {Either} from "./Either"
import {IssueConverter} from "./IssueConverter"

declare var global: any

interface BacklogScript {
  createBacklogClient: (space: string, domain: string, apiKey: string) => BacklogClient
  validateParameters: (space: string, apiKey: string, projectKey: string) => BacklogResult
  validateApiAccess: (client: BacklogClient, projectKey: string) => BacklogResult
  getProjectId: (client: BacklogClient, projectKey: string) => number
  createIssueConverter: (client: BacklogClient, projectId: number) => IssueConverter
  convertIssue: (converter: IssueConverter, issue: any) => BacklogResult
  createIssue: (client: BacklogClient, issue: Issue, optParentIssueId: Option<string>) => BacklogResult
  getParentIssueIdOrNull: (issue: Issue) => any
}

const BacklogScript = (): BacklogScript => ({
  createBacklogClient: (space: string, domain: string, apiKey: string): BacklogClient =>
    new BacklogClientImpl(new HttpClient, space, domain, apiKey),
  validateParameters: (space: string, apiKey: string, projectKey: string): BacklogResult =>
    ApiValidation().parameters(space, apiKey, projectKey).toBacklogResult(),
  validateApiAccess: (backlogClient: BacklogClient, projectKey: Key<Project>): BacklogResult =>
    ApiValidation().apiAccess(backlogClient, projectKey).toBacklogResult(),
  getProjectId: (backlogClient: BacklogClient, projectKey: Key<Project>): number =>
    backlogClient.getProjectV2(projectKey).map(project => project.id).getOrElse(() => -1),
  createIssueConverter: (client: BacklogClient, projectId: number) =>
    IssueConverter(
      client.getIssueTypesV2(projectId),
      client.getCategoriesV2(projectId),
      client.getVersionsV2(projectId),
      client.getPrioritiesV2(),
      client.getUsersV2(projectId)
    ),
  convertIssue: (converter: IssueConverter, issue: any): BacklogResult =>
    converter.convert(issue).toBacklogResult(),
  createIssue: (client: BacklogClient, issue: Issue, optParentIssueId: any): BacklogResult => {
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
      Option(optParentIssueId)
    )
    return client.createIssueV2(createIssue).toBacklogResult()
  },
  getParentIssueIdOrNull: (issue: Issue): any =>
    issue.parentIssueId.getOrElse(() => undefined)
});

(global as any).BacklogScript = BacklogScript()

export enum HeaderName {
  AssigneeId = "assigneeId",
  ParentIssueId = "parentIssueId",
  IssueTypeId = "issueTypeId",
  CategoryIds = "categoryId[]",
  VersionIds = "versionId[]",
  MilestoneIds = "milestoneId[]"
}


// global.convertValue = function(
//   backlogData: BacklogData,
//   keys: {},
//   i: number,
//   name: string,
//   value: any
// ): ConvertResult {
//   return recover(
//     validate((x: any) => x.constructor === Date, Utilities.formatDate(value, "JST", "yyyy-MM-dd"), ""),
//     () => {
//       switch (keys[name] as HeaderName) {
//         case HeaderName.AssigneeId:
//           const user = backlogData.findUserByName(value)
//           return validate((user: User) => user != null, user, `ユーザ ${value} は登録されていません`)
//         case HeaderName.ParentIssueId:
//           return recover(
//             validate((x: string) => x === "*" && i === 0, value, "1行目の親課題に '*' は使用できません"),
//             () => {
//               const projectKey = backlogData.project().projectKey()
//               // let issue = getIssueV2(getUserProperty("apiKey"), value)
//               // if (issue == null || !issue['id']) {
//               // 	showMessage_("課題 '" + value + "' は存在しません")
//               //   return ""
//               // }
//               // if (issue['parentIssueId']) {
//               // 	showMessage_("課題 '" + value + "' はすでに子課題となっているため、親課題として設定できません")
//               //   return ""
//               // }
//               // return issue["id"]
//               // }
//               return validate(
//                 (x: any) => x.indexOf(projectKey) !== -1,
//                 "ok",
//                 "課題 '" + value + "' はプロジェクト '" + projectKey + "' と異なっています"
//               )
//             }
//           )
//         case HeaderName.IssueTypeId:
//           const issueType = backlogData.findIssueTypeByName(value)
//           return validate(notNull, issueType.id, `種別名 ${value} は登録されていません`)
//         case HeaderName.CategoryIds:
//           let category = backlogData.findCategoryByName(value)
//           return validate(notNull, category.id, ` カテゴリ名 ${value} は登録されていません`)
//         case HeaderName.VersionIds:
//           let version = backlogData.findVersionByName(value)
//           return validate(notNull, version.id, ` 発生バージョン名 ${value} は登録されていません`)
//         case HeaderName.MilestoneIds:
//           let milestone = backlogData.findVersionByName(value)
//           return validate(notNull, milestone.id, ` マイルストーン名 ${value} は登録されていません`)
//       }
//     }
//   )
// }
