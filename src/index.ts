import {BacklogClient, BacklogClientImpl} from "./BacklogClient"
import {User, IssueType, notNull, Key, Project, Issue, Id, BacklogDefinition} from "./datas"
import {Http, HttpClient} from "./Http"
import {Option, Nullable, Some, None} from "./Option"
import {Either, Right, Left} from "./Either"
import {IssueConverter} from "./IssueConverter"
import {List} from "./List"

declare var global: any

type Validation<A> = (a: A, onError: Error) => Either<Error, A>

const isEmpty: Validation<string> = (str: string, onError: Error): Either<Error, string> =>
  str !== "" ? Right(str) : Left(onError)

const createBacklogClient = (space: string, domain: string, apiKey: string): Either<Error, BacklogClient> => {
  const spaceResult = isEmpty(space, Error("スペースURLを入力してください"))
  const apiKeyResult = isEmpty(apiKey, Error("APIキーを入力してください"))
  return Either.map2(spaceResult, apiKeyResult, (s, a) => {
    return Right(new BacklogClientImpl(new HttpClient, s, domain, a))
  })
}

const getProject = (client: BacklogClient, key: Key<Project>): Either<Error, Project> => {
  const result = client.getProjectV2(key)
  return result.recover(error => {
    if (error.message.indexOf("returned code 404") !== -1)
      return Left(Error("スペースまたはプロジェクトが見つかりません"))
    if (error.message.indexOf("returned code 401") !== -1)
      return Left(Error("認証に失敗しました"))
    return Left(Error(`APIアクセスエラー ${error.message}`))
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

const validate = (issues: List<any>): Either<Error, boolean> => {
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i]
    const errorString = `エラー ${i + 2} 行目: `
    if (!Option(issue.summary).isDefined)
      return Left(Error(`${errorString}'件名' が入力されていません`))
    if (!Option(issue.issueTypeName).isDefined)
      return Left(Error(`${errorString}'種別名' が入力されていません`))
  }
  return Right(true)
}

export const createIssue = (client: BacklogClient, issue: Issue, optParentIssueId: Option<number>): Either<Error, Issue> => {
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
  run: (space: string, domain: string, apiKey: string, key: Key<Project>, rawIssues: List<any>, onSuccess: (i: number, issue: Issue) => void, onWarn: (message: string) => void) => void
  definitions: (space: string, domain: string, apiKey: string, key: Key<Project>) => BacklogDefinition
}

const BacklogScript = (): BacklogScript => ({
  run: (space: string, domain: string, apiKey: string, key: Key<Project>, rawIssues: List<any>, onSuccess: (i: number, issue: Issue) => void, onWarn: (message: string) => void): void => {
    const isValid = validate(rawIssues).getOrError()
    const client = createBacklogClient(space, domain, apiKey).getOrError()
    const project = getProject(client, key).getOrError()
    const converter = createIssueConverter(client, project.id)
    const convertResults = rawIssues.map(issue => convertIssue(converter, issue))
    const issues = Either.sequence(convertResults).getOrError()

    // Post issues
    let previousIssue = Option<Issue>(null)
    for ( let i = 0; i < issues.length; i++) {
      let isTakenOverParentIssueId = false
      let optParentIssueId = issues[i].parentIssueId
      if (optParentIssueId.equals(Some("*"))) {
        if (previousIssue.flatMap(issue => issue.parentIssueId).isDefined) {
          previousIssue.map(issue => onWarn(`課題 '${issue.issueKey}' はすでに子課題となっているため、親課題として設定できません`))
          optParentIssueId = None<string>()
        } else {
          optParentIssueId = previousIssue.map(issue => issue.id.toString())
          isTakenOverParentIssueId = true
        }
      }
      createIssue(client, issues[i], optParentIssueId.map(id => +id)).map(issue => {
        if (!isTakenOverParentIssueId) {
          previousIssue = Some(issue)
        }
        onSuccess(i, issue)
      }).getOrError()
    }
  },
  definitions: (space: string, domain: string, apiKey: string, key: Key<Project>): BacklogDefinition => {
    const client = createBacklogClient(space, domain, apiKey).getOrError()
    const project = getProject(client, key).getOrError()

    return BacklogDefinition(
      client.getIssueTypesV2(project.id),
      client.getCategoriesV2(project.id),
      client.getVersionsV2(project.id),
      client.getPrioritiesV2(),
      client.getUsersV2(project.id),
      client.getCustomFieldsV2(project.id)
    )
  }
});

(global as any).BacklogScript = BacklogScript()
