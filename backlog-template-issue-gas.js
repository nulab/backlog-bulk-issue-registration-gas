// https://developers.google.com/apps-script/reference/spreadsheet/

// ------------------------- 定数 -------------------------

/** スクリプト名 */
var SCRIPT_NAME = "課題一括登録";

/** データが記載されているシートの名前 */
var TEMPLATE_SHEET_NAME = "Template";

/** Backlogの定義が記載されているシートの名前 */
var DEFINITION_SHEET_NAME = "定義一覧";

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

// ------------------------- 関数 -------------------------

/**
 * フック関数：スプレッドシート読み込み時に起動されます
 */
function onOpen() {
	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var menuEntries = [ 
		{ name : "STEP1: Backlogからデータを取得する", functionName: "init" },
		{ name : "STEP2: 課題一括登録を実行", functionName : "main" }
	];

	spreadSheet.addMenu("Backlog", menuEntries);
}

/**
 * Backlogのプロジェクト情報を取得し、定義シートに出力します
 */
function init() {
	var app = createApplication_('Backlog 定義一覧取得', 360, 160);
	var grid = createGrid_(app);
	showInputDialog_(app, grid, "init_run_");
}

/**
 * スプレッドシートのデータを読み込んで、Backlogに課題を一括登録します
 */
function main() {
	var app = createApplication_('Backlog 課題一括登録', 360, 160);
	var grid = createGrid_(app);
	showInputDialog_(app, grid, "main_run_");
}

/**
 * UIアプリケーションオブジェクトを作成します
 */
function createApplication_(title, width, height) {
	var app = UiApp.createApplication();
	
	app.setTitle(title);
	app.setWidth(width);
	app.setHeight(height);
	return app;
}

/**
 * パラメータ入力ダイアログを作成します
 */
function createGrid_(app) {
	var lastSpace = getUserProperty("space") ? getUserProperty("space") : "";
	var lastDomain = getUserProperty("domain") ? getUserProperty("domain") : ".com";
	var anotherDomain = (lastDomain === ".com") ? ".jp" : ".com";
	var lastUsername = getUserProperty("apikey") ? getUserProperty("apikey") : "";
	var lastProjectKey = getUserProperty("projectKey") ? getUserProperty("projectKey") : "";
	var grid = app.createGrid(3, 4);

	grid.setWidget(0, 0, app.createLabel('スペースID'));
	grid.setWidget(0, 1, app.createTextBox().setName("space").setValue(lastSpace));
	grid.setWidget(0, 2, app.createLabel('.backlog'));
	grid.setWidget(0, 3, app.createListBox(false).setName("domain").addItem(lastDomain).addItem(anotherDomain));
	grid.setWidget(1, 0, app.createLabel('APIキー'));
	grid.setWidget(1, 1, app.createTextBox().setName("apikey").setValue(lastUsername));
	grid.setWidget(2, 0, app.createLabel('プロジェクトキー'));
	grid.setWidget(2, 1, app.createTextBox().setName("projectKey").setValue(lastProjectKey));
	return grid;
}

/**
 * パラメータ入力ダイアログを表示します
 */
function showInputDialog_(app, grid, handlerName) {
	var panel = app.createVerticalPanel();
	var submitButton = app.createButton('実行');
	var submitHandler = app.createServerClickHandler(handlerName);	
  
	submitHandler.addCallbackElement(grid);
	submitButton.addClickHandler(submitHandler);
	panel.add(grid);
	panel.add(submitButton);
	app.add(panel);
	SpreadsheetApp.getActiveSpreadsheet().show(app);
}

/**
 * '一括登録'ボタンをクリックすることで呼び出されます
 */
function main_run_(grid) {
	var app = UiApp.getActiveApplication();
	var param = getParametersFromGrid(grid);
	var templateIssues = getTemplateIssuesFromSpreadSheet_();
	var keyLength = DEFAULT_COLUMN_LENGTH;
	var summaryLength = DEFAULT_COLUMN_LENGTH;
	var current = Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");
	var sheetName = SCRIPT_NAME + " : " + current;
	var onIssueCreated = function onIssueCreted(i, issue) {
		var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
		var issueKey = issue.issueKey;
		var summary = issue.summary;
		var fomula = '=hyperlink("' + param.space + ".backlog" + param.domain + "/" + "view/" + issueKey + '";"' + issueKey + '")';
		
		if (logSheet == null)
			logSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName, 2);
		keyLength = Math.max(keyLength, strLength_(issue.issueKey));
		summaryLength = Math.max(summaryLength, strLength_(summary));
		logKey_(logSheet, keyLength, i, fomula);
		logSummary_(logSheet, summaryLength, i, summary);
		SpreadsheetApp.flush();
	}
	var onWarn = function onWarn(message) {
		showMessage_(message);
	}

	// BacklogScript throws an exception on error
	storeUserProperty(param)
	BacklogScript.run(param.space, param.domain, param.apiKey, param.projectKey, templateIssues, onIssueCreated, onWarn);
	showMessage_(SCRIPT_NAME + " が正常に行われました");
	return app.close();
}

/**
 * Backlogプロジェクトの定義を取得します 
 */
function init_run_(grid) {
	var app = UiApp.getActiveApplication();
	var param = getParametersFromGrid(grid);
	var definition = BacklogScript.definitions(param.space, param.domain, param.apiKey, param.projectKey)
	var definitionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFINITION_SHEET_NAME);

	if (definitionSheet != null)
		SpreadsheetApp.getActiveSpreadsheet().deleteSheet(definitionSheet);
	definitionSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(DEFINITION_SHEET_NAME, 1);
	definitionSheet.getRange(1, 1).setValue("課題種別：");
	for (var i = 0; i < definition.issueTypes.length; i++) {
		var issueType = definition.issueTypes[i];
		definitionSheet.getRange(1, i + 2).setValue(issueType.name);
	}
	definitionSheet.getRange(2, 1).setValue("カテゴリー：");
	for (var i = 0; i < definition.categories.length; i++) {
		var category = definition.categories[i];
		definitionSheet.getRange(2, i + 2).setValue(category.name);
	}
	definitionSheet.getRange(3, 1).setValue("バージョン/マイルストーン：");
	for (var i = 0; i < definition.versions.length; i++) {
		var version = definition.versions[i];
		definitionSheet.getRange(3, i + 2).setValue(version.name);
	}
	definitionSheet.getRange(4, 1).setValue("優先度：");
	for (var i = 0; i < definition.priorities.length; i++) {
		var priority = definition.priorities[i];
		definitionSheet.getRange(4, i + 2).setValue(priority.name);
	}
	definitionSheet.getRange(5, 1).setValue("ユーザー：");
	for (var i = 0; i < definition.users.length; i++) {
		var user = definition.users[i];
		definitionSheet.getRange(5, i + 2).setValue(user.name);
	}
	definitionSheet.getRange(6, 1).setValue("カスタム属性：");
	for (var i = 0; i < definition.customFields.length; i++) {
		var customField = definition.customFields[i];
		definitionSheet.getRange(6, i + 2).setValue(customField.id + "(" + customField.name + ")=");
	}

	var templateSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEMPLATE_SHEET_NAME);
	var issueTypeRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.issueTypeNames(), true).build();
	var priorityRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.priorityNames(), true).build();
	var userRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.userNames(), true).build();
	var lastRow = templateSheet.getLastRow() - 1

	templateSheet.getRange(2, 7, lastRow).setDataValidation(issueTypeRule); // 7 = G
	templateSheet.getRange(2, 11, lastRow).setDataValidation(priorityRule); // 11 = K
	templateSheet.getRange(2, 12, lastRow).setDataValidation(userRule); // 12 = L
	showMessage_("Backlogの定義を取得完了しました");
	return app.close();
}

/**
 * Templateシートからすべての項目を課題配列に格納します
 */
function getTemplateIssuesFromSpreadSheet_() {
	var issues = [];
    var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = spreadSheet.getSheetByName(TEMPLATE_SHEET_NAME);
	var values = sheet.getSheetValues(
		ROW_START_INDEX, 
		COLUMN_START_INDEX,
		sheet.getLastRow() - 1, 
		sheet.getLastColumn()
	);

	for ( var i = 0; i < values.length; i++) {
		var issue = {
			summary: values[i][0] === "" ? undefined : values[i][0],
			description: values[i][1] === "" ? undefined : values[i][1],
			startDate: values[i][2] === "" ? undefined : values[i][2],
			dueDate: values[i][3] === "" ? undefined : values[i][3],
			estimatedHours: values[i][4] === "" ? undefined : values[i][4],
			actualHours: values[i][5] === "" ? undefined : values[i][5],
			issueTypeName: values[i][6] === "" ? undefined : values[i][6],
			categoryNames: values[i][7],
			versionNames: values[i][8],
			milestoneNames: values[i][9],
			priorityName: values[i][10] === "" ? undefined : values[i][10],
			assigneeName: values[i][11] === "" ? undefined : values[i][11],
			parentIssueKey: values[i][12] === "" ? undefined : values[i][12],
			customFields: values[i][13]
		};
		issues[i] = issue;
	}
	return issues;
}

/**
 * Gridから入力パラメータを取得します
 * 
 * @param {*} grid 
 * @return {object} パラメータ
 */
function getParametersFromGrid(grid) {
	return {
		space: grid.parameter.space,
		domain: grid.parameter.domain,
		apiKey: grid.parameter.apikey,
		projectKey: grid.parameter.projectKey.toUpperCase()
	}
}

/**
 * User propertyに入力パラメータを保存します
 * 
 * @param {object} param パラメータ 
 */
function storeUserProperty(param) {
	setUserProperty("space", param.space);
	setUserProperty("domain", param.domain);
	setUserProperty("apikey", param.apiKey);
	setUserProperty("projectKey", param.projectKey);
}

/**
 * 指定されたシートの (i + 1, COLUMN_START_INDEX) に課題URLのリンクを出力します
 * 
 * @param {Sheet} logSheet 
 * @param {number} length 式の文字数
 * @param {number} i シートの行インデックス
 * @param {string} fomula セルに出力する式
 */
function logKey_(logSheet, length, i, fomula) {
	var keyWidth = length * DEFAULT_FONT_SIZE * ADJUST_WIDTH_FACTOR;

	logSheet.getRange(i + 1, COLUMN_START_INDEX).setFormula(fomula).setFontColor("blue").setFontLine("underline");
	logSheet.setColumnWidth(COLUMN_START_INDEX + 1, keyWidth);
}

/**
 * 指定されたシートの (i + 1, COLUMN_START_INDEX + 1) に課題名を出力します
 * 
 * @param {Sheet} logSheet 
 * @param {number} length 内容の文字数
 * @param {number} i シートの行インデックス
 * @param {string} content セルに出力する内容
 */
function logSummary_(logSheet, length, i, content) {
	var summaryWidth = length * DEFAULT_FONT_SIZE * ADJUST_WIDTH_FACTOR;

	logSheet.getRange(i + 1, COLUMN_START_INDEX + 1).setValue(content);
	logSheet.setColumnWidth(COLUMN_START_INDEX + 1, summaryWidth);
}

/**
 * text の文字数を算出します
 * 
 * @param {string} 文字列 
 * @return {string} 調整済み文字数
 */
function strLength_(text) {
	var count = 0;

	for (var i = 0; i < text.length; i++) {
		var n = escape(text.charAt(i));
		if (n.length < 4)
			count += 1;
		else
			count += 2;
	}
	return count;
}

/**
 * ユーザープロパティをキーで取得します
 *
 * @param {string} key 取得したいプロパティキー名
 * @return {string} 対応する値 
 */
function getUserProperty(key) {
    return PropertiesService.getUserProperties().getProperty("bti." + key);
}

/**
 * ユーザープロパティをキーで設定します
 *
 * @param {string} key 設定したいプロパティキー名
 * @return {string} 対応する値 
 */
function setUserProperty(key, value) {
     PropertiesService.getUserProperties().setProperty("bti." + key, value);
}

/**
 * アクティブなシートにメッセージを表示します
 *
 * @param {string} message 表示するメッセージ
 */
function showMessage_(message) {
	SpreadsheetApp.getActiveSpreadsheet().toast(message, SCRIPT_NAME);
}
