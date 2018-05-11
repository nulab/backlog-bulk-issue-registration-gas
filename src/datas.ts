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
