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
	"担当者ユーザ名" : "assignerId",
	"親課題" : "parent_issue_id"
};

// ------------------------- グローバルオブジェクト -------------------------

/** 入力パラメータ */
var parameter = {
	PASSWORD : ""
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
	var request = new XmlRpcRequest(getRequestUri_(), "backlog.getProject");
	request.setAuthentication(UserProperties.getProperty("bti.username"),
			parameter.PASSWORD);
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
	var request = new XmlRpcRequest(getRequestUri_(), "backlog.getUsers");
	request.setAuthentication(UserProperties.getProperty("bti.username"),
			parameter.PASSWORD);
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
	var request = new XmlRpcRequest(getRequestUri_(), "backlog.createIssue");
	request.setAuthentication(UserProperties.getProperty("bti.username"),
			parameter.PASSWORD);
	request.addParam(issue);

	return request.send().parseXML();
}

/**
 * 課題キーを指定して、課題を取得します。
 *
 * @see http://www.backlog.jp/api/method2_4.html
 *
 */
function getIssue(params) {
	var request = new XmlRpcRequest(getRequestUri_(), "backlog.getIssue");
	request.setAuthentication(UserProperties.getProperty("bti.username"),
			parameter.PASSWORD);
	request.addParam(params);

	return request.send().parseXML();
}

function getRequestUri_() {
	return "https://" + UserProperties.getProperty("bti.space")
			+ ".backlog.jp/XML-RPC";
}

// ------------------------- 関数 -------------------------

/**
 * フック関数：スプレッドシート読み込み時に起動されます
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
 * スプレッドシートのデータを読み込んで、Backlogに課題を一括登録します
 */
function createIssues() {
	showInputDialog_();
}

function showInputDialog_() {
	var app = UiApp.createApplication();
	app.setTitle('Backlog 課題一括登録');
	app.setWidth(270);
	app.setHeight(200);

	var lastSpace = UserProperties.getProperty("bti.space") ? UserProperties
			.getProperty("bti.space") : "";
	var lastUsername = UserProperties.getProperty("bti.username") ? UserProperties
			.getProperty("bti.username")
			: "";
	var lastProjectKey = UserProperties.getProperty("bti.projectKey") ? UserProperties
			.getProperty("bti.projectKey")
			: "";

	var grid = app.createGrid(4, 2);
	grid.setWidget(0, 0, app.createLabel('スペースID'));
	grid.setWidget(0, 1, app.createTextBox().setName("space").setValue(
			lastSpace));
	grid.setWidget(1, 0, app.createLabel('ユーザID'));
	grid.setWidget(1, 1, app.createTextBox().setName("username").setValue(
			lastUsername));
	grid.setWidget(2, 0, app.createLabel('パスワード'));
	grid.setWidget(2, 1, app.createPasswordTextBox().setName("password"));
	grid.setWidget(3, 0, app.createLabel('プロジェクト'));
	grid.setWidget(3, 1, app.createTextBox().setName("projectKey").setValue(
			lastProjectKey));

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

function submit_(grid) {
	var app = UiApp.getActiveApplication();

	if (inputParameters_(grid) == false) {
		return;
	}

	try {
		checkParameters_();
	} catch (e) {
		SpreadsheetApp.getActiveSpreadsheet().toast(e, SCRIPT_NAME);
		return app.close();
	}

	var logSheet = createLogSheet_();
	createIssuesAndLog_(getTemplateIssues_(), logSheet);

	SpreadsheetApp.getActiveSpreadsheet().toast(SCRIPT_NAME + " が正常に行われました",
			SCRIPT_NAME);
	return app.close();
}

function inputParameters_(grid) {
	if (grid.parameter.space == "") {
		SpreadsheetApp.getActiveSpreadsheet().toast("スペースID を入力してください",
				SCRIPT_NAME);
		return false;
	}
	UserProperties.setProperty("bti.space", grid.parameter.space);

	if (grid.parameter.username == "") {
		SpreadsheetApp.getActiveSpreadsheet().toast("ユーザID を入力してください",
				SCRIPT_NAME);
		return false;
	}
	UserProperties.setProperty("bti.username", grid.parameter.username);

	// パスワードはUserPropertiesには格納しない
	if (grid.parameter.password == "") {
		SpreadsheetApp.getActiveSpreadsheet().toast("パスワード を入力してください",
				SCRIPT_NAME);
		return false;
	}
	parameter.PASSWORD = grid.parameter.password;

	if (grid.parameter.projectKey == "") {
		SpreadsheetApp.getActiveSpreadsheet().toast("プロジェクト を入力してください",
				SCRIPT_NAME);
		return false;
	}
	UserProperties.setProperty("bti.projectKey", grid.parameter.projectKey
			.toUpperCase());

	return true;
}

function checkParameters_() {
	var project;

	try {
		project = getProject(UserProperties.getProperty("bti.projectKey"));
	} catch (e) {
		throw "ログインに失敗しました";
	}

	if (project.id == undefined) {
		throw "プロジェクトの取得に失敗しました";
	}
}

function getTemplateIssues_() {
	var issues = [];

	var project = getProject(UserProperties.getProperty("bti.projectKey"));

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
				issue[CONVERT_NAME[name]] = convertValue_(name, values[i][j]);
			}
		}
		issues[i] = issue;
	}

	return issues;
}

function convertValue_(name, value) {
	if (value.constructor == Date) {
		return Utilities.formatDate(value, "JST", "yyyyMMdd");

	} else if (CONVERT_NAME[name] == "assignerId") {
		var user = getRegisteredUser_(value);
		if (user == null) {
			SpreadsheetApp.getActiveSpreadsheet().toast(
					"ユーザ '" + value + "' は登録されていません", SCRIPT_NAME);
			return 0;
		}
		return user.id;

	} else if (CONVERT_NAME[name] == "parent_issue_id") {
		if (value === "") {
			return value;
		} else {
			var issue = getIssue(value);
			return issue ? issue["id"] : "";
		}

	} else {
		return value;
	}
}

function getRegisteredUser_(userName) {
	for ( var i = 0; i < backlogRegistry.users.length; i++) {
		if (backlogRegistry.users[i].name == userName)
			return backlogRegistry.users[i];
	}

	return null;
}

function createIssuesAndLog_(newIssues, logSheet) {
	var keyLength = DEFAULT_COLUMN_LENGTH;
	var summaryLength = DEFAULT_COLUMN_LENGTH;
	for ( var i = 0; i < newIssues.length; i++) {
		var issue = createIssue(newIssues[i]);

		keyLength = Math.max(keyLength, getLength_(issue.key));
		logKey_(logSheet, keyLength, i, issue);

		summaryLength = Math.max(summaryLength, getLength_(issue.summary));
		logSummary_(logSheet, summaryLength, i, issue);

		SpreadsheetApp.flush();
	}
}

function createLogSheet_() {
	var current = Utilities
			.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");

	return SpreadsheetApp.getActiveSpreadsheet().insertSheet(
			SCRIPT_NAME + " : " + current);
}

function logKey_(logSheet, keyLength, i, issue) {
	var linkKey = '=hyperlink("' + issue.url + '";"' + issue.key + '")';
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
