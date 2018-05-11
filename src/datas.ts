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
}

export class ValidationResult {
  private success: boolean;
  private message: string;
  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}
