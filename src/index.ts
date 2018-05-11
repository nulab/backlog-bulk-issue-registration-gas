import { BacklogClient } from './BacklogClient';
import { BacklogData, ValidationResult, ConvertResult } from './datas';

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

global.convertValue = function(
  backlogData: BacklogData,
  keys: {},
  i: number,
  name: string,
  value: any
): ConvertResult {
  if (value.constructor == Date) {
    return new ConvertResult(true, Utilities.formatDate(value, 'JST', 'yyyy-MM-dd'));
  } else {
    switch (keys[name]) {
      case 'assigneeId':
        var user = backlogData.findUserByName(value);
        if (user == null) {
          return new ConvertResult(false, "ユーザ '" + value + "' は登録されていません");
        }
        return new ConvertResult(true, user.id());
      case 'parentIssueId':
        if (value === '*') {
          if (i == 0) {
            return new ConvertResult(false, "1行目の親課題に '*' は使用できません");
          } else {
            return new ConvertResult(true, value);
          }
        } else {
          var projectKey = backlogData.project().projectKey();
          if (value.indexOf(projectKey) != 0) {
            return new ConvertResult(
              false,
              "課題 '" + value + "' はプロジェクト '" + projectKey + "' と異なっています"
            );
          }
          // let issue = getIssueV2(getUserProperty("apiKey"), value);
          // if (issue == null || !issue['id']) {
					// 	showMessage_("課題 '" + value + "' は存在しません");
          //   return "";
          // }
          // if (issue['parentIssueId']) {
					// 	showMessage_("課題 '" + value + "' はすでに子課題となっているため、親課題として設定できません");
          //   return "";
          // }
          // return issue["id"];
        }
      case 'issueTypeId':
        let issueType = backlogData.findIssueTypeByName(value);
        if (issueType == null) {
          return new ConvertResult(false, " 種別名'" + value + "' は登録されていません");
        }
        return new ConvertResult(true, issueType.id);
      case 'categoryId[]':
        let category = backlogData.findCategoryByName(value);
        if (category == null) {
          return new ConvertResult(false, " カテゴリ名'" + value + "' は登録されていません");
        }
        return new ConvertResult(true, category.id);
      case 'versionId[]':
        let version = backlogData.findVersionByName(value);
        if (version == null) {
          return new ConvertResult(false, " 発生バージョン名'" + value + "' は登録されていません");
        }
        return new ConvertResult(true, version.id);
      case 'milestoneId[]':
        let milestone = backlogData.findVersionByName(value);
        if (milestone == null) {
          return new ConvertResult(false, " マイルストーン名'" + value + "' は登録されていません");
        }
        return new ConvertResult(true, milestone.id);
    }
  }
  return value;
};
