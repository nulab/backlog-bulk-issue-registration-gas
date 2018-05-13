import {User, IssueType, Category, Version, Project, Key, Issue} from "./datas"
import {Http} from "./Http"

export interface BacklogClient {

  /**
   * プロジェクトキーを指定して、プロジェクトを取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project/
   */
  getProjectV2: (projectKey: Key<Project>) => Project,

  /**
   * 課題キーを指定して、課題を取得します。※親課題に*ではなく具体的な課題キーを指定した場合
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue/
   *
   */
  getIssueV2: (id: Key<Issue>) => Issue,

  /**
   * 課題を追加します。追加に成功した場合は、追加された課題が返ります。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/add-issue/
   *
   */
  createIssueV2: (issue: Issue) => Issue,

  /**
   * プロジェクトの参加メンバーを返します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project-user-list/
   */
  getUsersV2: (projectId) => User[],

  /**
   * プロジェクトの種別一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
   */
  getIssueTypesV2: (projectId) => IssueType[],

  /**
   * プロジェクトのカテゴリ一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
   */
  getCategoriesV2(projectId): Category[],

  /**
   * プロジェクトのマイルストーン一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
   */
  getVersionsV2(projectId): Version[],
  buildUri: (resource: string) => string
}

export const BacklogClient = (http: Http, spaceName: string, domain: string, apiKey: string): BacklogClient => ({
  getProjectV2: (key: Key<Project>): Project => {
    const json = http.get(this.buildUri("projects/" + key))
    return Project(json["id"], json["projectKey"])
  },
  getIssueV2: (id: Key<Issue>): Issue =>  {
    const json = http.get("issues/" + id)
    return Issue(json["id"])
  },
  createIssueV2: (issue: Issue): Issue => {
    // TODO
    // if (issue["prorityId"] == undefined) {
    //   issue["priorityId"] = DEFAULT_PRIORITYID
    // }
    return this.post("issues", issue)
  },
  getUsersV2: (projectId: number): User[] => {
    const json = http.get(this.buildUri("projects/" + projectId + "/users"))
    return Object.keys(json).map(function(key) {
      return User(this["id"], this["name"])
    }, json)
  },
  getIssueTypesV2: (projectId: number): IssueType[] => {
    const json = http.get("projects/" + projectId + "/issueTypes")
    return Object.keys(json).map(function(key) {
      return IssueType(this["id"], this["name"])
    }, json)
  },
  getCategoriesV2: (projectId: number): Category[] =>  {
    const json = http.get("projects/" + projectId + "/categories")
    return Object.keys(json).map(function(key) {
      return Category(this["id"], this["name"])
    }, json)
  },
  getVersionsV2: (projectId: number): Version[] => {
    const json = http.get("projects/" + projectId + "/versions")
    return Object.keys(json).map(function(key) {
      return Version(this["id"], this["name"])
    }, json)
  },
  buildUri: (resource: string): string =>
    `https://${spaceName}.backlog${domain}/api/v2/${resource}?apiKey=${apiKey}`
})
