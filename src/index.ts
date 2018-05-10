import { getUserProperty } from './PropertyService';

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

/**
 * スプレッドシートのデータを読み込んで、Backlogに課題を一括登録します
 */
global.createIssues = function () {
  showInputDialog_();
}

/**
 * パラメータ入力ダイアログを表示します
 */
function showInputDialog_() {
  var app = UiApp.createApplication();
  app.setTitle('Backlog 課題一括登録');
  app.setWidth(360);
  app.setHeight(160);

  var lastSpace = getUserProperty('space') ? getUserProperty('space') : '';
  var lastDomain = getUserProperty('domain') ? getUserProperty('domain') : '.com';
  var anotherDomain = lastDomain === '.com' ? '.jp' : '.com';
  var lastUsername = getUserProperty('apikey') ? getUserProperty('apikey') : '';
  var lastProjectKey = getUserProperty('projectKey') ? getUserProperty('projectKey') : '';

  var grid = app.createGrid(3, 4);
  grid.setWidget(0, 0, app.createLabel('スペースID'));
  grid.setWidget(
    0,
    1,
    app
      .createTextBox()
      .setName('space')
      .setValue(lastSpace)
  );
  grid.setWidget(0, 2, app.createLabel('.backlog'));
  grid.setWidget(
    0,
    3,
    app
      .createListBox(false)
      .setName('domain')
      .addItem(lastDomain)
      .addItem(anotherDomain)
  );
  // grid.setWidget(0, 1, app.createTextBox().setName("space").setValue(lastSpace));
  grid.setWidget(1, 0, app.createLabel('APIキー'));
  grid.setWidget(
    1,
    1,
    app
      .createTextBox()
      .setName('apikey')
      .setValue(lastUsername)
  );
  grid.setWidget(2, 0, app.createLabel('プロジェクトキー'));
  grid.setWidget(
    2,
    1,
    app
      .createTextBox()
      .setName('projectKey')
      .setValue(lastProjectKey)
  );

  var button = app.createButton('一括登録');
  var handler = app.createServerClickHandler('submit_');
  handler.addCallbackElement(grid);
  button.addClickHandler(handler);

  var panel = app.createVerticalPanel();
  panel.add(grid);
  panel.add(button);
  app.add(panel);

  SpreadsheetApp.getActiveSpreadsheet().show(app);
}
