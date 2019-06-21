import {User, IssueType, Category, Version, Project, Key, Issue, Id, Priority, WithId, WithName, CustomFieldDefinition, CustomField, IdOrKey} from "./datas"
import {Http} from "./Http"
import {Option, None} from "./Option"
import {Either, Right, Left} from "./Either"
import {List} from "./List"

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
  getIssueV2: (idOrKey: IdOrKey<Issue>) => Option<Issue>,

  /**
   * 課題を追加します。追加に成功した場合は、追加された課題が返ります。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/add-issue/
   *
   */
  createIssueV2: (issue: Issue) => Either<Error, Issue>,

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

  /**
   * プロジェクトのカスタム属性一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-custom-field-list/
   */
  getCustomFieldsV2(id: Id<Project>): List<CustomFieldDefinition>,

  importFinalize: (projectKey: Key<Project>) => Either<Error, void>,
}

export interface DateFormatter {
  dateToString(date: Date): string
}

export class GoogleAppsScriptDateFormatter implements DateFormatter {
  public dateToString = (date: Date): string =>
    Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd")
}

const nullOrArray = <A>(items: List<A>): List<A> =>
  items.length > 0 ? items : undefined

const formatCustomFields = (customFields: List<CustomField>, dateFormatter: DateFormatter): List<CustomField> => {
  return customFields.map(customField => {
    if (customField.fieldTypeId === 4)
      return CustomField(customField.id, customField.fieldTypeId, dateFormatter.dateToString(new Date(customField.value)))
    return customField
  })
}

export const issueToObject = (issue: Issue, dateFormatter: DateFormatter): any => {
  const categoryIds = issue.categories.map(item => item.id)
  const versionIds = issue.versions.map(item => item.id)
  const milestoneIds = issue.milestones.map(item => item.id)
  return {
      projectId: issue.projectId,
      summary: issue.summary,
      description: issue.description.getOrElse(() => undefined),
      startDate: issue.startDate.map(dateFormatter.dateToString).getOrElse(() => undefined),
      dueDate: issue.dueDate.map(dateFormatter.dateToString).getOrElse(() => undefined),
      estimatedHours: issue.estimatedHours.getOrElse(() => undefined),
      actualHours: issue.actualHours.getOrElse(() => undefined),
      issueTypeId: issue.issueType.id,
      categoryId: nullOrArray(categoryIds),
      versionId: nullOrArray(versionIds),
      milestoneId: nullOrArray(milestoneIds),
      priorityId: issue.priority.id,
      assigneeId: issue.assignee.map(item => item.id).getOrElse(() => undefined),
      parentIssueId: issue.parentIssueId.getOrElse(() => undefined),
      customFields: nullOrArray(formatCustomFields(issue.customFields, dateFormatter))
    }
  }

export const objectToPayload = (obj: any): string => {
  const arr: string[] = Object.
    keys(obj)
    .filter(key => obj[key] !== undefined)
    .map(function (key) {
      if (key === "customFields") {
        const items: List<CustomField> = obj[key]
        return items.map(item => `customField_${item.id}=${encodeURIComponent(item.value)}`).join("&")
      }
      if (obj[key] instanceof Array) {
        const items: any[] = obj[key]
        return items.map(item => `${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`).join("&")
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`
    })
  return arr.join("&")
}

export class BacklogClientImpl implements BacklogClient {
  private http: Http
  private spaceName: string
  private domain: string
  private apiKey: string
  private dateFormatter: DateFormatter
  constructor(http: Http, spaceName: string, domain: string, apiKey: string, dateFormatter: DateFormatter) {
    this.http = http
    this.spaceName = spaceName
    this.domain = domain
    this.apiKey = apiKey
    this.dateFormatter = dateFormatter
  }

  public getProjectV2(key: Key<Project>): Either<Error, Project> {
    try {
      const json = this.http.get(this.buildUri(`projects/${key}`))
      return Right(Project(json["id"], json["projectKey"]))
    } catch (e) {
      return Left(e)
    }
  }

  public getIssueV2(idOrKey: IdOrKey<Issue>): Option<Issue> {
    try {
      const json = this.http.get(this.buildUri(`issues/${idOrKey}`))
      const issue = this.jsonToIssue(json)
      return Option(issue)
    } catch (e) {
      return None()
    }
  }

  public createIssueV2(issue: Issue): Either<Error, Issue> {
    try {
      const obj = issueToObject(issue, this.dateFormatter)
      const payload = objectToPayload(obj)
      const json = this.http.post(this.buildUri("issues"), payload)
      const createdIssue = this.jsonToIssue(json)
      return Right(createdIssue)
    } catch (e) {
      return Left(e)
    }
  }

  public getUsersV2(id: Id<Project>): User[] {
    const json = this.http.get(this.buildUri(`projects/${id}/users`))
    return Object.keys(json).map(key => this.jsonTo(json[key]))
  }

  public getIssueTypesV2(id: Id<Project>): IssueType[] {
    const json = this.http.get(this.buildUri(`projects/${id}/issueTypes`))
    return Object.keys(json).map(key => this.jsonTo(json[key]))
  }

  public getCategoriesV2(id: Id<Project>): Category[] {
    const json = this.http.get(this.buildUri(`projects/${id}/categories`))
    return Object.keys(json).map(key => this.jsonTo(json[key]))
  }

  public getVersionsV2(id: Id<Project>): Version[] {
    const json = this.http.get(this.buildUri(`projects/${id}/versions`))
    return Object.keys(json)
      .filter(key => !json[key]["archived"])
      .map(key => this.jsonTo(json[key]))
  }

  public getPrioritiesV2(): Priority[] {
    const json = this.http.get(this.buildUri(`priorities`))
    return Object.keys(json).map(key => this.jsonTo(json[key]))
  }

  public getCustomFieldsV2(id: Id<Project>): List<CustomFieldDefinition> {
    const json = this.http.get(this.buildUri(`projects/${id}/customFields`))
    return Object.keys(json).map(key =>
      CustomFieldDefinition(
        json[key]["id"],
        json[key]["typeId"],
        json[key]["name"],
        json[key]["required"],
        Option(json[key]["items"] as List<any>).map(items => items.map(this.jsonTo))
      )
    )
  }

  public importFinalize(projectKey: Key<Project>): Either<Error, void> {
    try {
      this.http.get(`https://${this.spaceName}.${this.domain}/api/v2/importer/spreadsheet?projectKey=${projectKey}`)
    } catch (e) {
      return Left(e)
    }
  }

  private buildUri(resource: string): string {
    return `https://${this.spaceName}.${this.domain}/api/v2/${resource}?apiKey=${this.apiKey}`
  }

  private jsonToIssue(json: JSON): Issue {
    return Issue(
      json["id"],
      json["issueKey"],
      json["projectId"],
      json["summary"],
      Option(json["description"]),
      Option(json["startDate"]).map(d => new Date(d)),
      Option(json["dueDate"]).map(d => new Date(d)),
      Option(json["estimatedHours"]),
      Option(json["actualHours"]),
      this.jsonTo(json["issueType"]),
      json["category"].map(this.jsonTo),
      json["versions"].map(this.jsonTo),
      json["milestone"].map(this.jsonTo),
      this.jsonTo(json["priority"]),
      Option(json["assignee"]).map(a => this.jsonTo(a)),
      Option(json["parentIssueId"]),
      json["customFields"].map(this.jsonTo)
    )
  }

  private jsonTo = (json: any): WithId & WithName =>
    ({id: json["id"], name: json["name"]})

}
