import { BacklogClient } from './BacklogClient';
import { BacklogData, ValidationResult } from './datas';

declare var global: any;

global.createBacklogClient = function(space, domain, apiKey) {
  return new BacklogClient(space, domain, apiKey);
};

global.validateParameters = function(
  space: string,
  apiKey: string,
  projectKey: string
): ValidationResult {
  if (space == '') {
    return new ValidationResult(false, 'スペースURL を入力してください');
  }
  if (apiKey == '') {
    return new ValidationResult(false, 'API Keyを入力してください');
  }
  if (projectKey == '') {
    return new ValidationResult(false, 'プロジェクト を入力してください');
  }
  return new ValidationResult(true, '');
};

global.validateApiAccess = function(
  backlogClient: BacklogClient,
  projectKey: string
): ValidationResult {
  try {
    let project = backlogClient.getProjectV2(projectKey);
    if (project.id == undefined)
      return new ValidationResult(false, 'プロジェクトの取得に失敗しました');
  } catch (e) {
    return new ValidationResult(false, 'ログインに失敗しました.' + e);
  }
  return new ValidationResult(true, '');
};

global.getBacklogData = function(backlogClient: BacklogClient, projectKey: string): BacklogData {
  let project = backlogClient.getProjectV2(projectKey);
  let users = backlogClient.getUsersV2(project.id);
  let issueTypes = backlogClient.getIssueTypesV2(project.id);
  let categories = backlogClient.getCategoriesV2(project.id);
  let versions = backlogClient.getVersionsV2(project.id);

  return new BacklogData(project, users, issueTypes, categories, versions);
};
