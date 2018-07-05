import {BacklogClient, BacklogClientImpl} from "./BacklogClient"
import {Key, Project, Issue, Id, BacklogDefinition} from "./datas"
import {HttpClient} from "./Http"
import {Option, Some, None} from "./Option"
import {Either, Right, Left} from "./Either"
import {IssueConverter} from "./IssueConverter"
import {List} from "./List"
import { Message } from "./resources";

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

export type Locale = "en" | "ja"

interface BacklogScript {
  run: (space: string, domain: string, apiKey: string, key: Key<Project>, rawIssues: List<any>, locale: Locale, onSuccess: (i: number, issue: Issue) => void, onWarn: (message: string) => void) => void
  definitions: (space: string, domain: string, apiKey: string, key: Key<Project>, locale: Locale) => BacklogDefinition,
  getMessage: (key: string, locale: string) => string
}

const BacklogScript = (): BacklogScript => ({
  run: (space: string, domain: string, apiKey: string, key: Key<Project>, rawIssues: List<any>, locale: Locale, onSuccess: (i: number, issue: Issue) => void, onWarn: (message: string) => void): void => {
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
  definitions: (space: string, domain: string, apiKey: string, key: Key<Project>, locale: Locale): BacklogDefinition => {
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
  getMessage: (key: string, locale: Locale): string =>
    Message.findByKey(key, locale)
});

(global as any).BacklogScript = BacklogScript()
