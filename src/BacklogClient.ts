import {User, IssueType, Category, Version, Project, Key, Issue, Id, Priority} from "./datas"
import {Http} from "./Http"
import {Option, Some, None} from "./Option"
import {Either, Right, Left} from "./Either"

export interface BacklogClient {

  /**
   * プロジェクトキーを指定して、プロジェクトを取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project/
   */
  getProjectV2: (projectKey: Key<Project>) => Either<Error, Project>,

  /**
   * 課題キーを指定して、課題を取得します。※親課題に*ではなく具体的な課題キーを指定した場合
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue/
   *
   */
  getIssueV2: (id: Id<Issue>) => Option<Issue>,

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

  /**
   * プロジェクトの優先度一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-priority-list/
   */
  getPrioritiesV2(): Priority[]
}

export class BacklogClientImpl implements BacklogClient {
  private http: Http
  private spaceName: string
  private domain: string
  private apiKey: string
  constructor(http: Http, spaceName: string, domain: string, apiKey: string) {
    this.http = http
    this.spaceName = spaceName
    this.domain = domain
    this.apiKey = apiKey
  }

  public getProjectV2(key: Key<Project>): Either<Error, Project> {
    try {
      const json = this.http.get(this.buildUri(`projects/${key}`))
      return Right(Project(json["id"], json["projectKey"]))
    } catch (e) {
      return Left(e)
    }
  }

  public getIssueV2(id: Id<Issue>): Option<Issue> {
    try {
      const json = this.http.get(this.buildUri(`issues/${id}`))
      const issue = this.jsonToIssue(json)
      return Option(issue)
    } catch (e) {
      return None()
    }
  }

  public createIssueV2(issue: Issue): Issue {
    // TODO
    // if (issue["prorityId"] == undefined) {
    //   issue["priorityId"] = DEFAULT_PRIORITYID
    // }
    const json = this.http.post("issues", issue)
    const createdIssue = this.jsonToIssue(json)
    return createdIssue
  }

  public getUsersV2(id: Id<Project>): User[] {
    const json = this.http.get(this.buildUri(`projects/${id}/users`))
    return Object.keys(json).map(key => this.jsonToUser(json[key]))
  }

  public getIssueTypesV2(id: Id<Project>): IssueType[] {
    const json = this.http.get(this.buildUri(`projects/${id}/issueTypes`))
    return Object.keys(json).map(key => this.jsonToIssueType(json[key]))
  }

  public getCategoriesV2(id: Id<Project>): Category[] {
    const json = this.http.get(this.buildUri(`projects/${id}/categories`))
    return Object.keys(json).map(key => this.jsonToCategory(json[key]))
  }

  public getVersionsV2(id: Id<Project>): Version[] {
    const json = this.http.get(this.buildUri(`projects/${id}/versions`))
    return Object.keys(json).map(key => this.jsonToVersion(json[key]))
  }

  public getPrioritiesV2(): Priority[] {
    const json = this.http.get(this.buildUri(`priorities`))
    return Object.keys(json).map(key => this.jsonToPriority(json[key]))
  }

  private buildUri(resource: string): string {
    return `https://${this.spaceName}.backlog${this.domain}/api/v2/${resource}?apiKey=${this.apiKey}`
  }

  private jsonToIssue(json: JSON): Issue {
    return Issue(
      json["id"],
      json["issueKey"],
      json["projectId"],
      json["summary"],
      Option(json["description"]),
      Option(json["startDate"]),
      Option(json["dueDate"]),
      Option(json["estimatedHours"]),
      Option(json["actualHours"]),
      this.jsonToIssueType(json["issueType"]),
      json["category"].map(this.jsonToCategory),
      json["versions"].map(this.jsonToVersion),
      json["milestone"].map(this.jsonToVersion),
      this.jsonToPriority(json["priority"]),
      Option(json["assignee"]).map(this.jsonToUser),
      Option(json["parentIssueId"])
    )
  }

  private jsonToUser(json: JSON): User {
    return User(json["id"], json["name"])
  }

  private jsonToIssueType(json: JSON): IssueType {
    return IssueType(json["id"], json["name"])
  }

  private jsonToCategory(json: JSON): Category {
    return Category(json["id"], json["name"])
  }

  private jsonToVersion(json: JSON): Version {
    return Version(json["id"], json["name"])
  }

  private jsonToPriority(json: JSON): Priority {
    return Priority(json["id"], json["name"])
  }


}
