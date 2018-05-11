export class User {
  private id: number;
  private name: string;
  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class IssueType {
  private id: number;
  private name: string;
  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class Category {
  private id: number;
  private name: string;
  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class Version {
  private id: number;
  private name: string;
  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class BacklogData {
  private project;
  private users;
  private issueTypes;
  private categories;
  private versions;
  constructor(project, users, issueTypes, categories, versions) {
    this.project = project;
    this.users = users;
    this.issueTypes = issueTypes;
    this.categories = categories;
    this.versions = versions;
  }
  public findUserByName(name: string): User {
    return this.users.filter(function(value) {
      return value.name == name;
    });
  }
  public findIssueTypeByName(name: string): IssueType {
    return this.issueTypes.filter(function(value) {
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
}

export class ValidationResult {
  private success: boolean;
  private message: string;
  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}
