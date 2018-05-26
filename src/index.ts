import {BacklogClient, BacklogClientImpl} from "./BacklogClient"
import {BacklogResult, User, IssueType, notNull, Key, Project, Issue, Id} from "./datas"
import {Http, HttpClient} from "./Http"
import {Option, Nullable} from "./Option"
import {Either, Right, Left} from "./Either"
import {IssueConverter} from "./IssueConverter"

declare var global: any

type Validation<A> = (a: A, onError: Error) => Either<Error, A>

const isEmpty: Validation<string> = (str: string, onError: Error): Either<Error, string> =>
  str !== "" ? Right(str) : Left(onError)

interface BacklogScript {
  createBacklogClient: (space: string, domain: string, apiKey: string) => BacklogClient
  getProjectId: (client: BacklogClient, key: Key<Project>) => Id<Project>
  createIssueConverter: (client: BacklogClient, projectId: number) => IssueConverter
  convertIssue: (converter: IssueConverter, issue: any) => BacklogResult
  createIssue: (client: BacklogClient, issue: Issue, optParentIssueId: Nullable<string>) => BacklogResult
  getParentIssueIdOrNull: (issue: Issue) => any
}

const BacklogScript = (): BacklogScript => ({
  createBacklogClient: (space: string, domain: string, apiKey: string): BacklogClient => {
    const spaceResult = isEmpty(space, Error("スペースURLを入力してください"))
    const apiKeyResult = isEmpty(apiKey, Error("APIキーを入力してください"))
    const client = Either.map2(spaceResult, apiKeyResult, (s, a) => {
      return Right(new BacklogClientImpl(new HttpClient, s, domain, a))
    })
    return client.getOrError()
  },
  getProjectId: (client: BacklogClient, key: Key<Project>): Id<Project> => {
    const result = client.getProjectV2(key)
    return result.recover(error => {
      if (error.message.indexOf("returned code 404") !== -1)
        return Left(Error("スペースまたはプロジェクトが見つかりません"))
      if (error.message.indexOf("returned code 401") !== -1)
        return Left(Error("認証に失敗しました"))
      return Left(Error(`APIアクセスエラー ${error.message}`))
    }).getOrError()
  },
  createIssueConverter: (client: BacklogClient, projectId: number): IssueConverter =>
    IssueConverter(
      client.getIssueTypesV2(projectId),
      client.getCategoriesV2(projectId),
      client.getVersionsV2(projectId),
      client.getPrioritiesV2(),
      client.getUsersV2(projectId)
    ),
  convertIssue: (converter: IssueConverter, issue: any): BacklogResult =>
    converter.convert(issue).toBacklogResult(),
  createIssue: (client: BacklogClient, issue: Issue, optParentIssueId: Nullable<string>): BacklogResult => {
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
