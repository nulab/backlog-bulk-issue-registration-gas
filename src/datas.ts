export class Project {
  private _id: number;
  private _projectKey: string;
  constructor(id: number, projectKey: string) {
    this._id = id;
    this._projectKey = projectKey;
  }
  public id(): number {
    return this._id;
  }
  public projectKey(): string {
    return this._projectKey;
  }
}

export class User {
  private _id: number;
  private _name: string;
  constructor(id: number, name: string) {
    this._id = id;
    this._name = name;
  }
  public id(): number {
    return this._id;
  }
  public name(): string {
    return this._name;
  }
}

export class IssueType {
  private _id: number;
  private _name: string;
  constructor(id: number, name: string) {
    this._id = id;
    this._name = name;
  }
  public id(): number {
    return this._id;
  }
  public name(): string {
    return this._name;
  }
}

export class Category {
  private _id: number;
  private _name: string;
  constructor(id: number, name: string) {
    this._id = id;
    this._name = name;
  }
  public id(): number {
    return this._id;
  }
  public name(): string {
    return this._name;
  }
}

export interface Versiont {
  readonly id: number;
  readonly name: string;
}
export const VersionT = (id: number, name: string) => ({id, name})

const version = VersionT(1, '');

export type Action = String | number | undefined;
export type Maybe<T> = T | undefined;

export interface ClientModule {
  getVersion: (id: number) => Maybe<Versiont>;
}

export const ClientModule = (apiKey: string): ClientModule => {
  const somethingPrivate = `test`;

  return {
    getVersion: (id: number): Maybe<Versiont> => {
      console.log(somethingPrivate);
      return version;
    }
  };
}

const client = ClientModule(`apiKey`);


export class Version {
  private _id: number;
  private _name: string;
  constructor(id: number, name: string) {
    this._id = id;
    this._name = name;
  }
  public id(): number {
    return this._id;
  }
  public name(): string {
    return this._name;
  }
}

export class BacklogData {
  private _project: Project;
  private users: User[];
  private issueTypes;
  private categories;
  private versions;
  constructor(project: Project, users: User[], issueTypes, categories, versions) {
    this._project = project;
    this.users = users;
    this.issueTypes = issueTypes;
    this.categories = categories;
    this.versions = versions;
  }
  public findUserByName(name: string): User {
    return this.users.filter(item => item.name() == name)[0];
  }
  public findIssueTypeByName(name: string): IssueType {
    return this.categories.filter(function(value) {
      return value.name == name;
    });
  }
  public findCategoryByName(name: string): Category {
    return this.categories.filter(function(value) {
      return value.name == name;
    });
  }
  public findVersionByName(name: string): Version {
    return this.versions.filter(function(value) {
      return value.name == name;
    });
  }
  public project(): Project {
    return this._project;
  }
}

export class ValidationResult {
  private success: boolean;
  private message: string;
  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}

export class ConvertResult {
  private _success: boolean;
  private _valueOrError: any;
  constructor(success: boolean, valueOrError: any) {
    this._success = success;
    this._valueOrError = valueOrError;
  }
  public success(): boolean {
    return this._success;
  }
  public valueOrError(): any {
    return this._valueOrError;
  }
}

export const success = <T>(value: T): ConvertResult => new ConvertResult(true, value);
export const error = <E>(error: E): ConvertResult => new ConvertResult(false, error);

export const validate = <T, U>(f: (t: T) => boolean, t: T, onError: U): ConvertResult =>
  f(t) ? success(t) : error(onError);

export const recover = <T>(result: ConvertResult, fallback: () => ConvertResult): ConvertResult =>
  result.success ? result : fallback();

export const notNull = <T, U>(t: T): boolean => t != null;
