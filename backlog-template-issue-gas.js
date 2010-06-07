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

/** 日本標準時のオフセット */
var JST_OFFSET = 9;

/** ヘッダ行の項目名 */
var CONVERT_NAME = {
	"件名" : "summary",
	"詳細" : "description",
	"開始日" : "start_date",
	"期限日" : "due_date",
	"予定時間" : "estimated_hours",
	"実績時間" : "actual_hours",
	"種別名" : "issueType",
	"カテゴリ名" : "component",
	"発生バージョン名" : "version",
	"マイルストーン名" : "milestone",
	"優先度ID" : "priorityId",
	"担当者ユーザ名" : "assignerId"
};

// ------------------------- グローバルオブジェクト -------------------------

/** 入力パラメータ */
var parameter = {
	SPACE : "",
	USERNAME : "",
	PASSWORD : "",
	PROJECT_KEY : "",
	REQUEST_URI : ""
};

/** Backlogに登録されているデータ */
var backlogRegistry = {
	users : []
};

// ------------------------- Backlog API -------------------------

/**
 * プロジェクトキーを指定して、プロジェクトを取得します。
 * 
 * @see http://www.backlog.jp/api/method1_2.html
 * 
 */
function getProject(projectKey) {
	var request = new XmlRpcRequest(parameter.REQUEST_URI, "backlog.getProject");
	request.setAuthentication(parameter.USERNAME, parameter.PASSWORD);
	request.addParam(projectKey);

	return request.send().parseXML();
}

/**
 * プロジェクトの参加メンバーを返します。
 * 
 * @see http://www.backlog.jp/api/method2_2.html
 * 
 */
function getUsers(projectId) {
	var request = new XmlRpcRequest(parameter.REQUEST_URI, "backlog.getUsers");
	request.setAuthentication(parameter.USERNAME, parameter.PASSWORD);
	request.addParam(projectId);

	return request.send().parseXML();
}

/**
 * 課題を追加します。追加に成功した場合は、追加された課題が返ります。
 * 
 * @see http://www.backlog.jp/api/method4_1.html
 * 
 */
function createIssue(issue) {
	var request = new XmlRpcRequest(parameter.REQUEST_URI,
			"backlog.createIssue");
	request.setAuthentication(parameter.USERNAME, parameter.PASSWORD);
	request.addParam(issue);

	return request.send().parseXML();
}

// ------------------------- 関数 -------------------------

/**
 * フック関数：スプレッドシート読み込み時に起動される
 */
function onOpen() {
	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var menuEntries = [ {
		name : SCRIPT_NAME,
		functionName : "createIssues"
	} ];

	spreadSheet.addMenu("Backlog", menuEntries);
}

/**
 * スプレッドシートのデータを読み込んで、Backlogに課題を一括登録する
 */
function createIssues() {
	if (inputParameters() == false) {
		SpreadsheetApp.getActiveSpreadsheet().toast(
				SCRIPT_NAME + " がキャンセルされました", SCRIPT_NAME);
		return;
	}

	try {
		checkParameters();
	} catch (e) {
		SpreadsheetApp.getActiveSpreadsheet().toast(e, SCRIPT_NAME);
		return;
	}

	createIssuesAndLog(getTemplateIssues());

	SpreadsheetApp.getActiveSpreadsheet().toast(SCRIPT_NAME + " が正常に行われました",
			SCRIPT_NAME);
}

function inputParameters() {
	var promptMessage = " を入力してください";

	parameter.SPACE = Browser.inputBox(SCRIPT_NAME, "'スペースID'" + promptMessage,
			Browser.Buttons.OK_CANCEL);
	if (parameter.SPACE == "cancel" || parameter.SPACE == "")
		return false;

	parameter.USERNAME = Browser.inputBox(SCRIPT_NAME, "'ユーザID'"
			+ promptMessage, Browser.Buttons.OK_CANCEL);
	if (parameter.USERNAME == "cancel" || parameter.USERNAME == "")
		return false;

	parameter.PASSWORD = Browser.inputBox(SCRIPT_NAME, "'パスワード'"
			+ promptMessage, Browser.Buttons.OK_CANCEL);
	if (parameter.PASSWORD == "cancel" || parameter.PASSWORD == "")
		return false;

	parameter.PROJECT_KEY = Browser.inputBox(SCRIPT_NAME,
			"'プロジェクト'" + promptMessage, Browser.Buttons.OK_CANCEL)
			.toUpperCase();
	if (parameter.PROJECT_KEY == "CANCEL" || parameter.PROJECT_KEY == "")
		return false;

	parameter.REQUEST_URI = "https://" + parameter.SPACE
			+ ".backlog.jp/XML-RPC";

	return true;
}

function checkParameters() {
	var project;

	try {
		project = getProject(parameter.PROJECT_KEY);
	} catch (e) {
		throw "ログインに失敗しました";
	}

	if (project.id == undefined) {
		throw "プロジェクトの取得に失敗しました";
	}
}

function getTemplateIssues() {
	var issues = [];

	var project = getProject(parameter.PROJECT_KEY);

	backlogRegistry.users = getUsers(project.id);

	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = spreadSheet.getSheetByName(TEMPLATE_SHEET_NAME);
	var values = sheet.getSheetValues(ROW_START_INDEX, COLUMN_START_INDEX,
			sheet.getLastRow() - 1, sheet.getLastColumn());

	for ( var i = 0; i < values.length; i++) {
		var issue = {
			projectId : project.id
		};
		for ( var j = 0; j < values[0].length; j++) {
			var name = sheet.getRange(ROW_HEADER_INDEX, j + 1).getValue();
			if (values[i][j] != undefined && values[i][j] != "") {
				issue[CONVERT_NAME[name]] = convertValue(name, values[i][j]);
			}
		}
		issues[i] = issue;
	}

	return issues;
}

function convertValue(name, value) {
	if (value.constructor == Date) {
		return convertDate(value, "yyyyMMdd");

	} else if (CONVERT_NAME[name] == "assignerId") {
		var user = getRegisteredUser(value);
		if (user == null) {
			SpreadsheetApp.getActiveSpreadsheet().toast(
					"ユーザ '" + value + "' は登録されていません", SCRIPT_NAME);
			return 0;
		}
		return user.id;

	} else {
		return value;
	}
}

function convertDate(date, format) {
	var GMTDate = date;
	GMTDate.setTime(GMTDate.getTime() + (JST_OFFSET * 60 * 60 * 1000));

	return Utilities.formatDate(GMTDate, "GMT", format);
}

function getRegisteredUser(userName) {
	for ( var i = 0; i < backlogRegistry.users.length; i++) {
		if (backlogRegistry.users[i].name == userName)
			return backlogRegistry.users[i];
	}

	return null;
}

function createIssuesAndLog(newIssues) {
	var logSheet = createLogSheet();

	var keyLength = DEFAULT_COLUMN_LENGTH;
	var summaryLength = DEFAULT_COLUMN_LENGTH;
	for ( var i = 0; i < newIssues.length; i++) {
		var issue = createIssue(newIssues[i]);

		keyLength = Math.max(keyLength, getLength(issue.key));
		logKey(logSheet, keyLength, i, issue);

		summaryLength = Math.max(summaryLength, getLength(issue.summary));
		logSummary(logSheet, summaryLength, i, issue);

		SpreadsheetApp.flush();
	}
}

function createLogSheet() {
	// TODO 現在、Utilities.formatDate() が"GMT"しか認識しない
	// - http://code.google.com/p/google-apps-script-issues/issues/detail?id=71

	var date = new Date();
	date.setHours(date.getHours() + JST_OFFSET);
	var current = Utilities.formatDate(date, "GMT", "yyyy/MM/dd HH:mm:ss");

	return SpreadsheetApp.getActiveSpreadsheet().insertSheet(
			SCRIPT_NAME + " : " + current);
}

function logKey(logSheet, keyLength, i, issue) {
	var linkKey = '=hyperlink("' + issue.url + '";"' + issue.key + '")';
	logSheet.getRange(i + 1, COLUMN_START_INDEX).setFormula(linkKey)
			.setFontColor("blue").setFontLine("underline");

	var keyWidth = keyLength * DEFAULT_FONT_SIZE * ADJUST_WIDTH_FACTOR;
	logSheet.setColumnWidth(COLUMN_START_INDEX + 1, keyWidth);
}

function logSummary(logSheet, summaryLength, i, issue) {
	logSheet.getRange(i + 1, COLUMN_START_INDEX + 1).setValue(
			issue.summary.toString());

	var summaryWidth = summaryLength * DEFAULT_FONT_SIZE * ADJUST_WIDTH_FACTOR;
	logSheet.setColumnWidth(COLUMN_START_INDEX + 1, summaryWidth);
}

function getLength(text) {
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
