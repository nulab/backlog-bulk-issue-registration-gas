import {Option} from "./Option"
import {List} from "./List"

export type Id<T> = number
export type Key<T> = string

export interface WithId {
  readonly id: number
}

export interface WithName {
  readonly name: String
}

export interface Project extends WithId {
  readonly id: number
  readonly projectKey: string
}
export const Project = (id: number, projectKey: string) => ({id, projectKey})

export interface Issue extends WithId {
  readonly id: number
  readonly issueKey: string
  readonly projectId: number
  readonly summary: string
  readonly description: Option<string>
  readonly startDate: Option<Date>
  readonly dueDate: Option<Date>
  readonly estimatedHours: Option<number>
  readonly actualHours: Option<number>
  readonly issueType: IssueType
  readonly categories: List<Category>
  readonly versions: List<Version>
  readonly milestones: List<Version>
  readonly priority: Priority
  readonly assignee: Option<User>
  readonly parentIssueId: Option<string>
}
export const Issue = (
  id: number,
  issueKey: string,
  projectId: number,
  summary: string,
  description: Option<string>,
  startDate: Option<Date>,
  dueDate: Option<Date>,
  estimatedHours: Option<number>,
  actualHours: Option<number>,
  issueType: IssueType,
  categories: List<Category>,
  versions: List<Version>,
  milestones: List<Version>,
  priority: Priority,
  assignee: Option<User>,
  parentIssueId: Option<string>
): Issue => ({id, issueKey, projectId, summary, description, startDate, dueDate, estimatedHours, actualHours, issueType, categories, versions, milestones, priority, assignee, parentIssueId})

export interface User extends WithId, WithName {}
export const User = (id: number, name: string) => ({id, name})

export interface IssueType extends WithId, WithName {}
export const IssueType = (id: number, name: string) => ({id, name})

export interface Category extends WithId, WithName {}
export const Category = (id: number, name: string) => ({id, name})

export interface Version extends WithId, WithName {}
export const Version = (id: number, name: string) => ({id, name})

export interface Priority extends WithId, WithName {}
export const Priority = (id: number, name: string) => ({id, name})

export interface BacklogResult {
  readonly success: boolean
  readonly message: string
  readonly value: any
}
export const BacklogResult = (success: boolean, message: string, value: any): BacklogResult => ({success, message, value})

// export const success = <T>(value: T): ConvertResult => new ConvertResult(true, value)
// export const error = <E>(error: E): ConvertResult => new ConvertResult(false, error)

// export const validate = <T, U>(f: (t: T) => boolean, t: T, onError: U): ConvertResult =>
//   f(t) ? success(t) : error(onError)

// export const recover = <T>(result: ConvertResult, fallback: () => ConvertResult): ConvertResult =>
//   result.success ? result : fallback()

export const notNull = <T, U>(t: T): boolean => t != null
export const isEmpty = (str: string): boolean => str === ""
