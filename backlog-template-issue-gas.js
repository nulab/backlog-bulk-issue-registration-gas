function onOpen() {
	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var menuEntries = [ {
		name : SCRIPT_NAME,
		functionName : "createIssues"
	} ];

	spreadSheet.addMenu("Backlog", menuEntries);
}

// ------------------------- 定数 -------------------------

SCRIPT_NAME = "課題一括登録";
TEMPLATE_SHEET_NAME = "Template";
ROW_HEADER_INDEX = 1;
ROW_START_INDEX = 2;
COLUMN_START_INDEX = 1;

DEFAULT_COLUMN_LENGTH = 16;
DEFAULT_FONT_SIZE = 10;
ADJUST_WIDTH_FACTOR = 0.75;

JST_OFFSET = 9;

CONVERT_NAME = {
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

// ------------------------- 関数 -------------------------

function createIssues() {
	if (inputParameters() == false) {
		SpreadsheetApp.getActiveSpreadsheet().toast(
				SCRIPT_NAME + " がキャンセルされました", SCRIPT_NAME);
		return;
	}
	createIssuesAndLog(getTemplateIssues());

	SpreadsheetApp.getActiveSpreadsheet().toast(SCRIPT_NAME + " が正常に行われました",
			SCRIPT_NAME);
}

function inputParameters() {
	var promptMessage = " を入力してください";

	// TODO クラスのプロパティ化
	SPACE = Browser.inputBox(SCRIPT_NAME, "'スペースID'" + promptMessage,
			Browser.Buttons.OK_CANCEL);
	if (SPACE == "cancel" || SPACE == "")
		return false;

	USERNAME = Browser.inputBox(SCRIPT_NAME, "'ユーザID'" + promptMessage,
			Browser.Buttons.OK_CANCEL);
	if (USERNAME == "cancel" || USERNAME == "")
		return false;

	PASSWORD = Browser.inputBox(SCRIPT_NAME, "'パスワード'" + promptMessage,
			Browser.Buttons.OK_CANCEL);
	if (PASSWORD == "cancel" || PASSWORD == "")
		return false;

	PROJECT_KEY = Browser.inputBox(SCRIPT_NAME, "'プロジェクト'" + promptMessage,
			Browser.Buttons.OK_CANCEL).toUpperCase();
	if (PROJECT_KEY == "CANCEL" || PROJECT_KEY == "")
		return false;

	REQUEST_URI = "https://" + SPACE + ".backlog.jp/XML-RPC";

	return true;
}

function getTemplateIssues() {
	var issues = [];

	var project = getProject(PROJECT_KEY);

	registeredUsers = getUsers(project.id); // TODO クラスのプロパティ化

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

function getProject(projectKey) {
	var request = new XmlRpcRequest(REQUEST_URI, "backlog.getProject");
	request.setAuthentication(USERNAME, PASSWORD);
	request.addParam(projectKey);

	return request.send().parseXML();
}

function getUsers(projectId) {
	var request = new XmlRpcRequest(REQUEST_URI, "backlog.getUsers");
	request.setAuthentication(USERNAME, PASSWORD);
	request.addParam(projectId);

	return request.send().parseXML();
}

function createIssue(issue) {
	var request = new XmlRpcRequest(REQUEST_URI, "backlog.createIssue");
	request.setAuthentication(USERNAME, PASSWORD);
	request.addParam(issue);

	return request.send().parseXML();
}

function convertValue(name, value) {
	if (value.constructor == Date) {
		return convertDate(value, "yyyyMMdd");

	} else if (CONVERT_NAME[name] == "assignerId") {
		var user = getRegisteredUser(value);
		if (user == null) {
			Logger.log("Don't find registered user '" + value + "'");
			return 0;
		}
		return user.id;

	} else {
		return value;
	}
}

function convertDate(date, format) {
	var GMTDate = date;
	GMTDate.setHours(GMTDate.getHours() + (GMTDate.getTimezoneOffset() / 60));

	return Utilities.formatDate(GMTDate, "GMT", format);
}

function getRegisteredUser(userName) {
	for ( var i = 0; i < registeredUsers.length; i++) {
		if (registeredUsers[i].name == userName)
			return registeredUsers[i];
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
