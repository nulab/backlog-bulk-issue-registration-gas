import { BacklogClient } from './BacklogClient';
import { ValidationResult } from './datas';

/** スクリプト名 */
var SCRIPT_NAME = '課題一括登録';

/** データが記載されているシートの名前 */
var TEMPLATE_SHEET_NAME = 'Template';

/** ヘッダ行のインデックス */
var ROW_HEADER_INDEX = 1;

/** データ行の開始インデックス */
var ROW_START_INDEX = 2;

/** データ列の開始インデックス */
var COLUMN_START_INDEX = 1;

/** 行のデフォルト長 */
var DEFAULT_COLUMN_LENGTH = 16;

/** フォントのデフォルトサイズ */
var DEFAULT_FONT_SIZE = 10;

/** 列幅調整時の係数 */
var ADJUST_WIDTH_FACTOR = 0.75;

/** ヘッダ行の項目名 */
// var CONVERT_NAME = {
//   '件名（必須）': 'summary',
//   '詳細': 'description',
// 	"開始日" : "startDate",
// 	"期限日" : "dueDate",
// 	"予定時間" : "estimatedHours",
// 	"実績時間" : "actualHours",
// 	"種別名（必須）" : "issueTypeId",
// 	"カテゴリ名" : "categoryId[]",
// 	"発生バージョン名" : "versionId[]",
// 	"マイルストーン名" : "milestoneId[]",
// 	"優先度ID" : "priorityId",
// 	"担当者ユーザ名" : "assigneeId",
// 	"親課題" : "parentIssueId"
// };

/** 優先度IDのデフォルト値 */
var DEFAULT_PRIORITYID = 3;

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
