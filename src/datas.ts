import {Maybe} from "./Maybe"

export type Id<T> = number
export type Key<T> = string

export interface Project {
  readonly id: number
  readonly projectKey: string
}
export const Project = (id: number, projectKey: string) => ({id, projectKey})

export interface Issue {
  readonly id: number
  readonly projectId: number
  readonly summary: string
  readonly description: Maybe<string>
  readonly startDate: Maybe<Date>
  readonly dueDate: Maybe<Date>
  readonly estimatedHours: Maybe<number>
  readonly actualHours: Maybe<number>
  readonly issueType: IssueType
  readonly categories: Category[]
  readonly versions: Version[]
  readonly milestones: Version[]
  readonly priority: Priority
  readonly assignee: Maybe<User>
  readonly parentIssueId: Maybe<number>
}
export const Issue = (
  id: number,
  projectId: number,
  summary: string,
  description: Maybe<string>,
  startDate: Maybe<Date>,
  dueDate: Maybe<Date>,
  estimatedHours: Maybe<number>,
  actualHours: Maybe<number>,
  issueType: IssueType,
  categories: Category[],
  versions: Version[],
  milestones: Version[],
  priority: Priority,
  assignee: Maybe<User>,
  parentIssueId: Maybe<number>
) => ({id, projectId, summary, description, startDate, dueDate, estimatedHours, actualHours, issueType, categories, versions, milestones, priority, assignee, parentIssueId})

export interface User {
  readonly id: number
  readonly name: string
}
export const User = (id: number, name: string) => ({id, name})

export interface IssueType {
  readonly id: number
  readonly name: string
}
export const IssueType = (id: number, name: string) => ({id, name})

export interface Category {
  readonly id: number
  readonly name: string
}
export const Category = (id: number, name: string) => ({id, name})

export interface Version {
  readonly id: number
  readonly name: string
}
export const Version = (id: number, name: string) => ({id, name})

export interface Priority {
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

export class ValidationResult {
  private success: boolean
  private message: string
  constructor(success: boolean, message: string) {
    this.success = success
    this.message = message
  }
}

export class ConvertResult {
  private _success: boolean
  private _valueOrError: any
  constructor(success: boolean, valueOrError: any) {
    this._success = success
    this._valueOrError = valueOrError
  }
  public success(): boolean {
    return this._success
  }
  public valueOrError(): any {
    return this._valueOrError
  }
}

export const success = <T>(value: T): ConvertResult => new ConvertResult(true, value)
export const error = <E>(error: E): ConvertResult => new ConvertResult(false, error)

export const validate = <T, U>(f: (t: T) => boolean, t: T, onError: U): ConvertResult =>
  f(t) ? success(t) : error(onError)

export const recover = <T>(result: ConvertResult, fallback: () => ConvertResult): ConvertResult =>
  result.success ? result : fallback()

export const notNull = <T, U>(t: T): boolean => t != null
