import {BacklogClient, BacklogClientImpl} from "./BacklogClient"
import {BacklogResult, User, IssueType, notNull, Key, Project, Issue} from "./datas"
import {Http, HttpClient} from "./Http"
import {Option, Nullable} from "./Option"
import {Validation, ApiValidation} from "./ApiValidation"
import {Either} from "./Either"
import {IssueConverter} from "./IssueConverter"

declare var global: any

interface BacklogScript {
  createBacklogClient: (space: string, domain: string, apiKey: string) => BacklogClient
  validateParameters: (space: string, apiKey: string, projectKey: string, onFail: (e: Error) => void) => void
  validateApiAccess: (client: BacklogClient, projectKey: string, onFail: (e: Error) => void) => void
  getProjectId: (client: BacklogClient, projectKey: string) => number
  createIssueConverter: (client: BacklogClient, projectId: number) => IssueConverter
  convertIssue: (converter: IssueConverter, issue: any) => BacklogResult
  createIssue: (client: BacklogClient, issue: Issue, optParentIssueId: Nullable<string>) => BacklogResult
  getParentIssueIdOrNull: (issue: Issue) => any
}

const BacklogScript = (): BacklogScript => ({
  createBacklogClient: (space: string, domain: string, apiKey: string): BacklogClient =>
    new BacklogClientImpl(new HttpClient, space, domain, apiKey),
  validateParameters: (space: string, apiKey: string, projectKey: string, onFail: (e: Error) => void): void =>
    ApiValidation().parameters(space, apiKey, projectKey).onError(onFail),
  validateApiAccess: (backlogClient: BacklogClient, projectKey: Key<Project>, onFail: (e: Error) => void): void =>
    ApiValidation().apiAccess(backlogClient, projectKey).onError(onFail),
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
