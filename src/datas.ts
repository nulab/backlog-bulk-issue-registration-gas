import {Option} from "./Option"
import { List } from "./List";

export type Id<T> = number
export type Key<T> = string

export interface WithName {
  readonly name: String
}

export interface Project {
  readonly id: number
  readonly projectKey: string
}
export const Project = (id: number, projectKey: string) => ({id, projectKey})

export interface Issue {
  readonly id: number
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
  readonly parentIssueId: Option<number>
}
export const Issue = (
  id: number,
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
  parentIssueId: Option<number>
): Issue => ({id, projectId, summary, description, startDate, dueDate, estimatedHours, actualHours, issueType, categories, versions, milestones, priority, assignee, parentIssueId})

export interface User extends WithName {
  readonly id: number
  readonly name: string
}
export const User = (id: number, name: string) => ({id, name})

export interface IssueType extends WithName {
  readonly id: number
  readonly name: string
}
export const IssueType = (id: number, name: string) => ({id, name})

export interface Category extends WithName {
  readonly id: number
  readonly name: string
}
export const Category = (id: number, name: string) => ({id, name})

export interface Version extends WithName {
  readonly id: number
  readonly name: string
}
export const Version = (id: number, name: string) => ({id, name})

export interface Priority extends WithName {
  readonly id: number
  readonly name: string
}
export const Priority = (id: number, name: string) => ({id, name})

export type Action = String | number | undefined

// export interface ClientModule {
//   getVersion: (id: number) => Maybe<Version>
// }

// export const ClientModule = (apiKey: string): ClientModule => {
//   const somethingPrivate = `test`

//   return {
//     getVersion: (id: number): Maybe<Version> => {
//       console.log(somethingPrivate)
//       return version
//     }
//   }
// }

// const client = ClientModule(`apiKey`)

export class BacklogData {
  private _project: Project
  private users: User[]
  private issueTypes
  private categories
  private versions
  constructor(project: Project, users: User[], issueTypes, categories, versions) {
    this._project = project
    this.users = users
    this.issueTypes = issueTypes
    this.categories = categories
    this.versions = versions
  }
  public findUserByName(name: string): User {
    return this.users.filter(item => item.name === name)[0]
  }
  public findIssueTypeByName(name: string): IssueType {
    return this.categories.filter(function(value) {
      return value.name === name
    })
  }
  public findCategoryByName(name: string): Category {
    return this.categories.filter(function(value) {
      return value.name === name
    })
  }
  public findVersionByName(name: string): Version {
    return this.versions.filter(function(value) {
      return value.name === name
    })
  }
  public project(): Project {
    return this._project
  }
}

export interface ValidationResult {
  readonly success: boolean
  readonly message: string
}
export const ValidationResult = (success: boolean, message: string): ValidationResult => ({success, message})

// export const success = <T>(value: T): ConvertResult => new ConvertResult(true, value)
// export const error = <E>(error: E): ConvertResult => new ConvertResult(false, error)

// export const validate = <T, U>(f: (t: T) => boolean, t: T, onError: U): ConvertResult =>
//   f(t) ? success(t) : error(onError)

// export const recover = <T>(result: ConvertResult, fallback: () => ConvertResult): ConvertResult =>
//   result.success ? result : fallback()

export const notNull = <T, U>(t: T): boolean => t != null
export const isEmpty = (str: string): boolean => str === ""
