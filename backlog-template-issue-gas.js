// ------------------------- 定数 -------------------------

/** スクリプト名 */
var SCRIPT_NAME = "課題一括登録";

/** データが記載されているシートの名前 */
var TEMPLATE_SHEET_NAME = "Template";

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

/** 優先度IDのデフォルト値 */
var DEFAULT_PRIORITYID = "3";

// ------------------------- 関数 -------------------------

/**
 * フック関数：スプレッドシート読み込み時に起動されます
 */
function onOpen() {
	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var menuEntries = [ {
		name : SCRIPT_NAME,
		functionName : "main"
	} ];

	spreadSheet.addMenu("Backlog", menuEntries);
}

/**
 * スプレッドシートのデータを読み込んで、Backlogに課題を一括登録します
 */
function main() {
	var app = createApplication_('Backlog 課題一括登録', 360, 160);
	var grid = createGrid_(app);
	showInputDialog_(app, grid);
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
	// grid.setWidget(0, 1, app.createTextBox().setName("space").setValue(lastSpace));
	grid.setWidget(1, 0, app.createLabel('APIキー'));
	grid.setWidget(1, 1, app.createTextBox().setName("apikey").setValue(lastUsername));
	grid.setWidget(2, 0, app.createLabel('プロジェクトキー'));
	grid.setWidget(2, 1, app.createTextBox().setName("projectKey").setValue(lastProjectKey));
	return grid;
}

/**
 * パラメータ入力ダイアログを表示します
 */
function showInputDialog_(app, grid) {
	var panel = app.createVerticalPanel();
	var button = app.createButton('一括登録');
	var handler = app.createServerClickHandler('submit_');
	
	handler.addCallbackElement(grid);
	button.addClickHandler(handler);
	panel.add(grid);
	panel.add(button);
	app.add(panel);
	SpreadsheetApp.getActiveSpreadsheet().show(app);
}

/**
 * '一括登録'ボタンをクリックすることで呼び出されます
 */
function submit_(grid) {
	var app = UiApp.getActiveApplication();
	var space = grid.parameter.space;
	var domain = grid.parameter.domain;
	var apiKey = grid.parameter.apikey;
	var projectKey = grid.parameter.projectKey.toUpperCase();
	var backlogClient = BacklogScript.createBacklogClient(space, domain, apiKey);
	var onFailed = function (error) {
		throw error
	}

	// Validation
	BacklogScript.validateParameters(space, apiKey, projectKey, onFailed);
	BacklogScript.validateApiAccess(backlogClient, projectKey, onFailed);

	// Store user params
	setUserProperty("space", space);
	setUserProperty("domain", domain);
	setUserProperty("apikey", apiKey);
    setUserProperty("projectKey", projectKey.toUpperCase());

	var projectId = BacklogScript.getProjectId(backlogClient, projectKey);
	var templateIssues = getTemplateIssuesFromSpreadSheet_(apiKey, projectId);
	var issueConverter = BacklogScript.createIssueConverter(backlogClient, projectId);
	var convertedIssues = [];

	for (var i = 0; i < templateIssues.length; i++) {
		var convertResult = BacklogScript.convertIssue(issueConverter, templateIssues[i]);
		if (!convertResult.success) {
			showMessage_(convertResult.message);
			return app.close();
		}
		convertedIssues[i] = convertResult.value;
	} 
	createIssuesAndLog_(app, backlogClient, convertedIssues);
	showMessage_(SCRIPT_NAME + " が正常に行われました");
	return app.close();
}

function getTemplateIssuesFromSpreadSheet_(apiKey, projectId) {
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
			projectId: projectId,
			summary: values[i][0],
			description: values[i][1] === "" ? undefined : values[i][1],
			startDate: values[i][2] === "" ? undefined : values[i][2],
			dueDate: values[i][3] === "" ? undefined : values[i][3],
			estimatedHours: values[i][4] === "" ? undefined : values[i][4],
			actualHours: values[i][5] === "" ? undefined : values[i][5],
			issueTypeName: values[i][6] === "" ? undefined : values[i][6],
			categoryNames: values[i][7],
			versionNames: values[i][8],
			milestoneNames: values[i][9],
			priorityId: values[i][10] === "" ? DEFAULT_PRIORITYID : values[i][10],
			assigneeName: values[i][11] === "" ? undefined : values[i][11],
			parentIssueKey: values[i][12] === "" ? undefined : values[i][12]
		};
		issues[i] = issue;
	}
	return issues;
}

function createIssuesAndLog_(app, backlogClient, newIssues) {
	var logSheet = createLogSheet_();
	var keyLength = DEFAULT_COLUMN_LENGTH;
	var summaryLength = DEFAULT_COLUMN_LENGTH;

	var previousIssue = null;
	for ( var i = 0; i < newIssues.length; i++) {
		var isTakenOverParentIssueId = false;
		var parentIssueId = BacklogScript.getParentIssueIdOrNull(newIssues[i]);
		if (parentIssueId && parentIssueId === "*") {
			if (previousIssue && BacklogScript.getParentIssueIdOrNull(previousIssue)) {
				showMessage_("課題 '" + previousIssue.issueKey + "' はすでに子課題となっているため、親課題として設定できません");
				parentIssueId = "";
			} else {
				parentIssueId = previousIssue.id;
				isTakenOverParentIssueId = true;
			}
		}
		var result = BacklogScript.createIssue(backlogClient, newIssues[i], parentIssueId);
		if (!result.success) {
			showMessage_(result.message);
			return app.close();
		}

		var issue = result.value;
		keyLength = Math.max(keyLength, getLength_(issue.issueKey));
		logKey_(logSheet, keyLength, i, issue);

		summaryLength = Math.max(summaryLength, getLength_(issue.summary));
		logSummary_(logSheet, summaryLength, i, issue);

		SpreadsheetApp.flush();

		if (!isTakenOverParentIssueId) {
			previousIssue = issue;
		}
	}
}

/**
 * ログ出力用のシートを作成します
 */
function createLogSheet_() {
	var current = Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");
	return SpreadsheetApp.getActiveSpreadsheet().insertSheet(SCRIPT_NAME + " : " + current);
}

function logKey_(logSheet, keyLength, i, issue) {
	var linkKey = '=hyperlink("' + getUserProperty("space") 
		+ ".backlog" + getUserProperty("domain")  + "/" 
		+ "view/" + issue.issueKey + '";"' + issue.issueKey + '")';
	logSheet.getRange(i + 1, COLUMN_START_INDEX).setFormula(linkKey)
		.setFontColor("blue").setFontLine("underline");

	var keyWidth = keyLength * DEFAULT_FONT_SIZE * ADJUST_WIDTH_FACTOR;
	logSheet.setColumnWidth(COLUMN_START_INDEX + 1, keyWidth);
}

function logSummary_(logSheet, summaryLength, i, issue) {
	logSheet.getRange(i + 1, COLUMN_START_INDEX + 1).setValue(
		issue.summary.toString());

	var summaryWidth = summaryLength * DEFAULT_FONT_SIZE * ADJUST_WIDTH_FACTOR;
	logSheet.setColumnWidth(COLUMN_START_INDEX + 1, summaryWidth);
}

function getLength_(text) {
	var count = 0;

	for ( var i = 0; i < text.length; i++) {
		var n = escape(text.charAt(i));
		if (n.length < 4) {
			count += 1;
		} else {
			count += 2;
		}
	}

	return count;
}

/**
 * ユーザープロパティをキーで取得します
 *
 * @param {string} key 取得したいプロパティキー名
 * @return {string} value 対応する値 
 */
function getUserProperty(key) {
    return PropertiesService.getUserProperties().getProperty("bti." + key);
}

/**
 * ユーザープロパティをキーで設定します
 *
 * @param {string} key 設定したいプロパティキー名
 * @return {string} value 対応する値 
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

/**
* Log用シートにログを1行追加します
*
* @param {string} type 1列目に出力したい文字列
* @param {string} value 2列目に出力したい文字列
*/
function logToSheet(type, value) {
	var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('log');
	var logMsg = new Array();
	  
	if (sheet == null)
		SpreadsheetApp.getActiveSpreadsheet().insertSheet('log');
	logMsg.push(new Date());
	logMsg.push(type);
	logMsg.push(value);
	SpreadsheetApp.getActiveSpreadsheet().getSheetByName('log').appendRow(logMsg);
  }