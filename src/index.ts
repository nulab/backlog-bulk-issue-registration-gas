import {BacklogClient} from "./BacklogClient"
import {BacklogData, ValidationResult, ConvertResult, success, error, validate, User, recover, IssueType, notNull, Key, Project} from "./datas"
import {Http} from "./Http"
import {Maybe} from "./Maybe"

declare var global: any

interface BacklogScript {
  createBacklogClient: (http: Http, space: string, domain: string, apiKey: string) => BacklogClient
  validateParameters: (space: string, apiKey: string, projectKey: string) => ValidationResult
  validateApiAccess: (client: BacklogClient, projectKey: string) => ValidationResult
  getProjectId: (client: BacklogClient, projectKey: string) => number
  // getBacklogData: (client: BacklogClient, projectKey: string) => BacklogData
}

const BacklogScript = (): BacklogScript => ({
  createBacklogClient: (http: Http, space: string, domain: string, apiKey: string): BacklogClient => BacklogClient(http, space, domain, apiKey),
  validateParameters: (space: string, apiKey: string, projectKey: string): ValidationResult => {
    if (space === "") {
      return new ValidationResult(false, "スペースURL を入力してください")
    }
    if (apiKey === "") {
      return new ValidationResult(false, "API Keyを入力してください")
    }
    if (projectKey === "") {
      return new ValidationResult(false, "プロジェクト を入力してください")
    }
    return new ValidationResult(true, "")
  },
  validateApiAccess: (backlogClient: BacklogClient, projectKey: Key<Project>): ValidationResult => {
    const maybeProject = backlogClient.getProjectV2(projectKey)
    return maybeProject.map(function (project) {
      return new ValidationResult(true, "")
    }).getOrElse(new ValidationResult(false, "ログインに失敗しました."))
  },
  getProjectId: (backlogClient: BacklogClient, projectKey: Key<Project>): number => {
    return backlogClient.getProjectV2(projectKey).getOrElse(Project(-1, projectKey)).id
  }
  // getBacklogData: (backlogClient: BacklogClient, projectKey: string): BacklogData => {
  //   let project = backlogClient.getProjectV2(projectKey)
  //   let users = backlogClient.getUsersV2(project.id)
  //   let issueTypes = backlogClient.getIssueTypesV2(project.id)
  //   let categories = backlogClient.getCategoriesV2(project.id)
  //   let versions = backlogClient.getVersionsV2(project.id)
  //   return new BacklogData(project, users, issueTypes, categories, versions)
  // }
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
