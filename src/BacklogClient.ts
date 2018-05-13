import {User, IssueType, Category, Version, Project, Key, Issue, Id, Priority} from "./datas"
import {Http} from "./Http"
import {Maybe} from "./Maybe"

export interface BacklogClient {

  /**
   * プロジェクトキーを指定して、プロジェクトを取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project/
   */
  getProjectV2: (projectKey: Key<Project>) => Maybe<Project>,

  /**
   * 課題キーを指定して、課題を取得します。※親課題に*ではなく具体的な課題キーを指定した場合
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue/
   *
   */
  getIssueV2: (id: Id<Issue>) => Maybe<Issue>,

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
  getUsersV2: (id: Id<Project>) => User[],

  /**
   * プロジェクトの種別一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
   */
  getIssueTypesV2: (id: Id<Project>) => IssueType[],

  /**
   * プロジェクトのカテゴリ一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
   */
  getCategoriesV2(id: Id<Project>): Category[],

  /**
   * プロジェクトのマイルストーン一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
   */
  getVersionsV2(id: Id<Project>): Version[],
  buildUri: (resource: string) => string
}

export const BacklogClient = (http: Http, spaceName: string, domain: string, apiKey: string): BacklogClient => ({
  getProjectV2: (key: Key<Project>): Maybe<Project> => {
    try {
      const json = http.get(this.buildUri(`projects/${key}`))
      return Maybe.some(Project(json["id"], json["projectKey"]))
    } catch (e) {
      return Maybe.none()
    }
  },
  getIssueV2: (id: Id<Issue>): Maybe<Issue> =>  {
    try {
      const json = http.get(`issues/${id}`)
      return Maybe.some(
        Issue(
          json["id"],
          json["projectId"],
          json["summary"],
          Maybe.fromValue(json["description"]),
          Maybe.fromValue(json["startDate"]),
          Maybe.fromValue(json["dueDate"]),
          Maybe.fromValue(json["estimatedHours"]),
          Maybe.fromValue(json["actualHours"]),
          json["issueTypeId"],
          json["category"].map(item => Category(item["id"], item["name"])),
          json["versions"].map(item => Version(item["id"], item["name"])),
          json["milestone"].map(item => Version(item["id"], item["name"])),
          Priority(json["id"], json["name"]),
          Maybe.fromValue(json["assignee"]).map(item => User(item["id"], item["name"])),
          Maybe.fromValue(json["parentIssueId"])
        )
      )
    } catch (e) {
      return Maybe.none()
    }
  },
  createIssueV2: (issue: Issue): Issue => {
    // TODO
    // if (issue["prorityId"] == undefined) {
    //   issue["priorityId"] = DEFAULT_PRIORITYID
    // }
    return this.post("issues", issue)
  },
  getUsersV2: (id: Id<Project>): User[] => {
    const json = http.get(this.buildUri(`projects/${id}/users`))
    return Object.keys(json).map(function(key) {
      return User(this["id"], this["name"])
    }, json)
  },
  getIssueTypesV2: (id: Id<Project>): IssueType[] => {
    const json = http.get(`projects/${id}/issueTypes`)
    return Object.keys(json).map(function(key) {
      return IssueType(this["id"], this["name"])
    }, json)
  },
  getCategoriesV2: (id: Id<Project>): Category[] =>  {
    const json = http.get(`projects/${id}/categories`)
    return Object.keys(json).map(function(key) {
      return Category(this["id"], this["name"])
    }, json)
  },
  getVersionsV2: (id: Id<Project>): Version[] => {
    const json = http.get(`projects/${id}/versions`)
    return Object.keys(json).map(function(key) {
      return Version(this["id"], this["name"])
    }, json)
  },
  buildUri: (resource: string): string =>
    `https://${spaceName}.backlog${domain}/api/v2/${resource}?apiKey=${apiKey}`
})
