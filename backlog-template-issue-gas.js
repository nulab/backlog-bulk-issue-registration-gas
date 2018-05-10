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
	"件名（必須）" : "summary",
	"詳細" : "description",
	"開始日" : "startDate",
	"期限日" : "dueDate",
	"予定時間" : "estimatedHours",
	"実績時間" : "actualHours",
	"種別名（必須）" : "issueTypeId",
	"カテゴリ名" : "categoryId[]",
	"発生バージョン名" : "versionId[]",
	"マイルストーン名" : "milestoneId[]",
	"優先度ID" : "priorityId",
	"担当者ユーザ名" : "assigneeId",
	"親課題" : "parentIssueId"
};


/** 優先度IDのデフォルト値 */
var DEFAULT_PRIORITYID = "3";

// ------------------------- グローバルオブジェクト -------------------------

/** 入力パラメータ */
var parameter = {
	PASSWORD : ""
};

/** Backlogに登録されているデータ */
var backlogRegistry = {
	users : [],
	issueTypes : [],
	categories : [],
	versions : []
};

// ------------------------- Backlog API -------------------------

/**
 * プロジェクトキーを指定して、プロジェクトを取得します。
 *
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project/
 *
 */

function getProjectV2(projectKey) {
	var uri = getRequestUri_V2() + "projects/" + PropertiesService.getUserProperties().getProperty("bti.projectKey") +
	"?apiKey=" + PropertiesService.getUserProperties().getProperty("bti.apikey");
	var request = UrlFetchApp.fetch(uri);
	return JSON.parse(request.getContentText());
}

/**
 * プロジェクトの参加メンバーを返します。
 *
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project-user-list/
 *
 */

function getUsersV2(projectId) {
	var uri = getRequestUri_V2() + "projects/" + projectId + "/users" + "?apiKey=" + PropertiesService.getUserProperties().getProperty("bti.apikey");
	var request = UrlFetchApp.fetch(uri);
	return JSON.parse(request.getContentText());
}

/**
 * 課題を追加します。追加に成功した場合は、追加された課題が返ります。
 *
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/add-issue/
 *
 */

function createIssueV2(issue) {
	if (issue["prorityId"] == undefined) {
		issue["priorityId"] = DEFAULT_PRIORITYID;
	}

	var uri = getRequestUri_V2() + "issues" + "?apiKey=" + PropertiesService.getUserProperties().getProperty("bti.apikey");
	var param = {
		"method" : "post",
        "payload" : issue
	};
	Logger.log(uri);
	var request = UrlFetchApp.fetch(uri, param);

	return JSON.parse(request.getContentText());
}

/**
 * 課題キーを指定して、課題を取得します。※親課題に*ではなく具体的な課題キーを指定した場合
 *
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue/
 *
 */

function getIssueV2(issueId) {

	var uri = getRequestUri_V2() + "issues/" + issueId
	+ "?apiKey=" + PropertiesService.getUserProperties().getProperty("bti.apikey");	
	var request = UrlFetchApp.fetch(uri);
	return JSON.parse(request.getContentText());
}

/**
 * プロジェクトの種別一覧を取得します。
 *
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
 *
 */

function getIssueTypesV2(projectId) {
	var uri = getRequestUri_V2() + "projects/" + projectId + "/issueTypes" + "?apiKey=" + PropertiesService.getUserProperties().getProperty("bti.apikey");
	var request = UrlFetchApp.fetch(uri);
	return JSON.parse(request.getContentText());
}

/**
 * プロジェクトのカテゴリ一覧を取得します。
 *
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
 *
 */

function getCategoriesV2(projectId) {
	var uri = getRequestUri_V2() + "projects/" + projectId + "/categories" + "?apiKey=" + PropertiesService.getUserProperties().getProperty("bti.apikey");
	var request = UrlFetchApp.fetch(uri);
	return JSON.parse(request.getContentText());
}

/**
 * プロジェクトのマイルストーン一覧を取得します。
 *
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
 *
 */

function getVersionsV2(projectId) {
	var uri = getRequestUri_V2() + "projects/" + projectId + "/versions" + "?apiKey=" + PropertiesService.getUserProperties().getProperty("bti.apikey");
	var request = UrlFetchApp.fetch(uri);
	return JSON.parse(request.getContentText());
}

function getRequestUri_V2() {
	return "https://" + PropertiesService.getUserProperties().getProperty("bti.space")
			+ ".backlog"+ PropertiesService.getUserProperties().getProperty("bti.domain") + "/api/v2/";
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
	app.setWidth(360);
	app.setHeight(160);

	var lastSpace = PropertiesService.getUserProperties().getProperty("bti.space")
    		? PropertiesService.getUserProperties().getProperty("bti.space")
			: "";
	var lastDomain = PropertiesService.getUserProperties().getProperty("bti.domain")
    		? PropertiesService.getUserProperties().getProperty("bti.domain")
			: ".com";
	var anotherDomain = (lastDomain === ".com") ? ".jp" : ".com";
	var lastUsername = PropertiesService.getUserProperties().getProperty("bti.apikey")
    		? PropertiesService.getUserProperties().getProperty("bti.apikey")
			: "";
	var lastProjectKey = PropertiesService.getUserProperties().getProperty("bti.projectKey")
    		? PropertiesService.getUserProperties().getProperty("bti.projectKey")
			: "";

	var grid = app.createGrid(3, 4);
	grid.setWidget(0, 0, app.createLabel('スペースID'));
	grid.setWidget(0, 1, app.createTextBox().setName("space").setValue(
		lastSpace));
	grid.setWidget(0, 2, app.createLabel('.backlog'));
	grid.setWidget(0, 3, app.createListBox(false).setName("domain").addItem(lastDomain).addItem(anotherDomain));
	// grid.setWidget(0, 1, app.createTextBox().setName("space").setValue(lastSpace));
	grid.setWidget(1, 0, app.createLabel('APIキー'));
	grid.setWidget(1, 1, app.createTextBox().setName("apikey").setValue(
		lastUsername));
//	grid.setWidget(2, 0, app.createLabel('パスワード'));
//	grid.setWidget(2, 1, app.createPasswordTextBox().setName("password"));
	grid.setWidget(2, 0, app.createLabel('プロジェクトキー'));
	grid.setWidget(2, 1, app.createTextBox().setName("projectKey").setValue(
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
		SpreadsheetApp.getActiveSpreadsheet().toast("スペースURL を入力してください",
			SCRIPT_NAME);
		return false;
	}
	PropertiesService.getUserProperties().setProperty("bti.space", grid.parameter.space);
	PropertiesService.getUserProperties().setProperty("bti.domain", grid.parameter.domain);
	if (grid.parameter.apikey == "") {
		SpreadsheetApp.getActiveSpreadsheet().toast("API Keyを入力してください",
			SCRIPT_NAME);
		return false;
	}
 	PropertiesService.getUserProperties().setProperty("bti.apikey", grid.parameter.apikey);
	// 	PropertiesService.getUserProperties().setProperty("bti.username", grid.parameter.username);

	// パスワードはUserPropertiesには格納しない
	// if (grid.parameter.password == "") {
	//	SpreadsheetApp.getActiveSpreadsheet().toast("パスワード を入力してください",
	//		SCRIPT_NAME);
	//	return false;
	//}
	//parameter.PASSWORD = grid.parameter.password;

	if (grid.parameter.projectKey == "") {
		SpreadsheetApp.getActiveSpreadsheet().toast("プロジェクト を入力してください",
			SCRIPT_NAME);
		return false;
	}
	PropertiesService.getUserProperties().setProperty("bti.projectKey", grid.parameter.projectKey
			.toUpperCase());

	return true;
}

function checkParameters_() {
	var project;

	try {
		project = getProjectV2(PropertiesService.getUserProperties().getProperty("bti.projectKey"));
	} catch (e) {
		throw "ログインに失敗しました";
	}

	if (project.id == undefined) {
		throw "プロジェクトの取得に失敗しました";
	}
}

function getTemplateIssues_() {
	var issues = [];

	var project = getProjectV2(PropertiesService.getUserProperties().getProperty("bti.projectKey"));

	backlogRegistry.users = getUsersV2(project.id);
	backlogRegistry.issueTypes = getIssueTypesV2(project.id);	
	backlogRegistry.categories = getCategoriesV2(project.id);
	backlogRegistry.versions = getVersionsV2(project.id);

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
				issue[CONVERT_NAME[name]] = convertValue_(i, name, values[i][j]);
			}
		}
		issues[i] = issue;
	}

	return issues;
}

function convertValue_(i, name, value) {
	if (value.constructor == Date) {
		return Utilities.formatDate(value, "JST", "yyyy-MM-dd");

	} else {
		switch (CONVERT_NAME[name]) {
			case "assigneeId":
				var user = getRegisteredUser_(value);
				if (user == null) {
					SpreadsheetApp.getActiveSpreadsheet().toast(
						"ユーザ '" + value + "' は登録されていません", SCRIPT_NAME);
					return 0;
				}
				return user.id;
				break;
			case "parentIssueId":
				if (value === "*") {
					if (i == 0) {
						SpreadsheetApp.getActiveSpreadsheet().toast(
							"1行目の親課題に '*' は使用できません", SCRIPT_NAME);
						return "";
					} else {
						return value;
					}
				} else {
					if (value.indexOf(PropertiesService.getUserProperties().getProperty("bti.projectKey")) != 0) {
						SpreadsheetApp.getActiveSpreadsheet().toast(
							"課題 '" + value + "' はプロジェクト '" + PropertiesService.getUserProperties().getProperty("bti.projectKey") + "' と異なっています", SCRIPT_NAME);
						return "";
					}
					var issue = getIssueV2(value);
					if (issue == null || !issue['id']) {
						SpreadsheetApp.getActiveSpreadsheet().toast(
								"課題 '" + value + "' は存在しません", SCRIPT_NAME);
						return "";
					}
					if (issue['parentIssueId']) {
						SpreadsheetApp.getActiveSpreadsheet().toast(
							"課題 '" + value + "' はすでに子課題となっているため、親課題として設定できません", SCRIPT_NAME);
						return "";
					}
					return issue["id"];
				}
				break;
			case "issueTypeId":
				var issueType = getRegisteredIssueType_(value);
				if (issueType == null) {
					SpreadsheetApp.getActiveSpreadsheet().toast(
						" 種別名'" + value + "' は登録されていません", SCRIPT_NAME);
					return 0;
				}
				return issueType.id;
				break;
			case "categoryId[]":
				var category = getRegisteredCategory_(value);
				if (category == null) {
					SpreadsheetApp.getActiveSpreadsheet().toast(
						" カテゴリ名'" + value + "' は登録されていません", SCRIPT_NAME);
					return 0;
				}
				return category.id;
				break;				
			case "versionId[]":
				var version = getRegisteredVersion_(value);
				if (version == null) {
					SpreadsheetApp.getActiveSpreadsheet().toast(
						" 発生バージョン名'" + value + "' は登録されていません", SCRIPT_NAME);
					return 0;
				}
				return version.id;
				break;					
			case "milestoneId[]":
				var milestone = getRegisteredVersion_(value);
				if (milestone == null) {
					SpreadsheetApp.getActiveSpreadsheet().toast(
						" マイルストーン名'" + value + "' は登録されていません", SCRIPT_NAME);
					return 0;
				}
				return milestone.id;
				break;	
		}			
	}
	return value;			
}

function getRegisteredUser_(userName) {
	for ( var i = 0; i < backlogRegistry.users.length; i++) {
		if (backlogRegistry.users[i].name == userName)
			return backlogRegistry.users[i];
	}

	return null;
}

function getRegisteredIssueType_(issueTypeName) {
	for ( var i = 0; i < backlogRegistry.issueTypes.length; i++) {
		if (backlogRegistry.issueTypes[i].name == issueTypeName)
			return backlogRegistry.issueTypes[i];
	}

	return null;
}

function getRegisteredCategory_(categoryName) {
	for ( var i = 0; i < backlogRegistry.categories.length; i++) {
		if (backlogRegistry.categories[i].name == categoryName)
			return backlogRegistry.categories[i];
	}
	return null;
}

function getRegisteredVersion_(versionName) {
	for ( var i = 0; i < backlogRegistry.versions.length; i++) {
		if (backlogRegistry.versions[i].name == versionName)
			return backlogRegistry.versions[i];
	}
	return null;
}

function createIssuesAndLog_(newIssues, logSheet) {
	var keyLength = DEFAULT_COLUMN_LENGTH;
	var summaryLength = DEFAULT_COLUMN_LENGTH;

	var previousIssue = null;
	for ( var i = 0; i < newIssues.length; i++) {
		var isTakenOverParentIssueId = false;
		if (newIssues[i]['parentIssueId'] === "*") {
			if (previousIssue && previousIssue['parentIssueId']) {
				SpreadsheetApp.getActiveSpreadsheet().toast(
						"課題 '" + previousIssue.issueKey + "' はすでに子課題となっているため、親課題として設定できません", SCRIPT_NAME);
				newIssues[i]['parentIssueId'] = "";
			} else {
				newIssues[i]['parentIssueId'] = previousIssue.id;
				isTakenOverParentIssueId = true;
			}
		}
		var issue = createIssueV2(newIssues[i]);
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

function createLogSheet_() {
	var current = Utilities
		.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");

	return SpreadsheetApp.getActiveSpreadsheet().insertSheet(
			SCRIPT_NAME + " : " + current);
}

function logKey_(logSheet, keyLength, i, issue) {
	var linkKey = '=hyperlink("' + PropertiesService.getUserProperties().getProperty("bti.space") 
		+ ".backlog.jp/" 
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
