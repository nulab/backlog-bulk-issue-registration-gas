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

/** Backlogに登録されているデータ */
var backlogRegistry = {
	users : [],
	issueTypes : [],
	categories : [],
	versions : []
};

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
	var app = UiApp.createApplication();
	app.setTitle('Backlog 課題一括登録');
	app.setWidth(360);
	app.setHeight(160);

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
	var space = grid.parameter.space;
	var domain = grid.parameter.domain;
	var apiKey = grid.parameter.apikey;
	var projectKey = grid.parameter.projectKey.toUpperCase();
	var backlogClient = createBacklogClient(space, domain, apiKey);

	var validateParamsResult = validateParameters(space, apiKey, projectKey);
	if (!validateParamsResult.success) return;
	setParametersAsProperty_(grid); // TODO: Remove later

	var validateApiResult = validateApiAccess(backlogClient, projectKey);
	if (!validateApiResult.success) {
		showMessage_(validateApiResult.message);
		return app.close();
	}

	var logSheet = createLogSheet_();
	createIssuesAndLog_(apiKey, getTemplateIssues_(), logSheet);
	showMessage_(SCRIPT_NAME + " が正常に行われました");
	return app.close();
}

function setParametersAsProperty_(grid) {
	setUserProperty("space", grid.parameter.space);
	setUserProperty("domain", grid.parameter.domain);
	setUserProperty("apikey", grid.parameter.apikey);
    setUserProperty("projectKey", grid.parameter.projectKey.toUpperCase());
}

function getTemplateIssues_() {
	var issues = [];
    var apiKey = getUserProperty("apikey");
	var project = getProjectV2(apiKey, getUserProperty("projectKey"));
    
	backlogRegistry.users = getUsersV2(apiKey, project.id);
	backlogRegistry.issueTypes = getIssueTypesV2(apiKey, project.id);	
	backlogRegistry.categories = getCategoriesV2(apiKey, project.id);
	backlogRegistry.versions = getVersionsV2(apiKey, project.id);

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
					showMessage_("ユーザ '" + value + "' は登録されていません");
					return 0;
				}
				return user.id;
				break;
			case "parentIssueId":
				if (value === "*") {
					if (i == 0) {
						showMessage_("1行目の親課題に '*' は使用できません");
						return "";
					} else {
						return value;
					}
				} else {
                    var projectKey = getProperty("bti.projectKey");
                  
					if (value.indexOf(projectKey) != 0) {
						showMessage_("課題 '" + value + "' はプロジェクト '" + projectKey + "' と異なっています");
						return "";
					}
					var issue = getIssueV2(getUserProperty("apiKey"), value);
					if (issue == null || !issue['id']) {
						showMessage_("課題 '" + value + "' は存在しません");
						return "";
					}
					if (issue['parentIssueId']) {
						showMessage_("課題 '" + value + "' はすでに子課題となっているため、親課題として設定できません");
						return "";
					}
					return issue["id"];
				}
				break;
			case "issueTypeId":
				var issueType = getRegisteredIssueType_(value);
				if (issueType == null) {
					showMessage_(" 種別名'" + value + "' は登録されていません");
					return 0;
				}
				return issueType.id;
				break;
			case "categoryId[]":
				var category = getRegisteredCategory_(value);
				if (category == null) {
					showMessage_(" カテゴリ名'" + value + "' は登録されていません");
					return 0;
				}
				return category.id;
				break;				
			case "versionId[]":
				var version = getRegisteredVersion_(value);
				if (version == null) {
					showMessage_(" 発生バージョン名'" + value + "' は登録されていません");
					return 0;
				}
				return version.id;
				break;					
			case "milestoneId[]":
				var milestone = getRegisteredVersion_(value);
				if (milestone == null) {
					showMessage_(" マイルストーン名'" + value + "' は登録されていません");
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

function createIssuesAndLog_(apiKey, newIssues, logSheet) {
	var keyLength = DEFAULT_COLUMN_LENGTH;
	var summaryLength = DEFAULT_COLUMN_LENGTH;

	var previousIssue = null;
	for ( var i = 0; i < newIssues.length; i++) {
		var isTakenOverParentIssueId = false;
		if (newIssues[i]['parentIssueId'] === "*") {
			if (previousIssue && previousIssue['parentIssueId']) {
				showMessage_("課題 '" + previousIssue.issueKey + "' はすでに子課題となっているため、親課題として設定できません");
				newIssues[i]['parentIssueId'] = "";
			} else {
				newIssues[i]['parentIssueId'] = previousIssue.id;
				isTakenOverParentIssueId = true;
			}
		}
		var issue = createIssueV2(apiKey, newIssues[i]);
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
	var linkKey = '=hyperlink("' + getUserProperty("space") 
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