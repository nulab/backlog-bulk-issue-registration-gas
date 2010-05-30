function onOpen() {
	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var menuEntries = [ {
		name : "課題一括登録",
		functionName : "createIssues"
	} ];

	spreadSheet.addMenu("Backlog", menuEntries);
}

// ------------------------- 定数 -------------------------

TEMPLATE_SHEET_NAME = "Template";
ROW_HEADER_INDEX = 1;
ROW_START_INDEX = 2;
COLUMN_START_INDEX = 1;

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
	var promptMessage = " を入力してください";

	// TODO クラスのプロパティ化
	SPACE = Browser.inputBox("'スペースID'" + promptMessage);
	if (SPACE == "cancel" || SPACE == "") {
		return;
	}
	USERNAME = Browser.inputBox("'ユーザID'" + promptMessage);
	if (USERNAME == "cancel" || USERNAME == "") {
		return;
	}
	PASSWORD = Browser.inputBox("'パスワード'" + promptMessage);
	if (PASSWORD == "cancel" || PASSWORD == "") {
		return;
	}
	PROJECT_KEY = Browser.inputBox("'プロジェクト'" + promptMessage);
	if (PROJECT_KEY == "cancel" || PROJECT_KEY == "") {
		return;
	}
	REQUEST_URI = "https://" + SPACE + ".backlog.jp/XML-RPC";

	var newIssues = getTemplateIssues();

	var issues = [];
	for ( var i = 0; i < newIssues.length; i++) {
		issues.push(createIssue(newIssues[i]));
	}

	// TODO 下記のメソッドでalertが出る。Help forumにあがっているが、まだ解決していない。
	// - http://www.google.com/support/forum/p/apps-script/thread?tid=307b1739a0216017&hl=en
	Browser.msgBox("課題一括登録が正常に行われました");
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

	// TODO Parseに時間かかるかもなので、要検証
	// return request.send().parseXML();
	return request.send();
}

function convertValue(name, value) {
	if (value.constructor == Date) {
		return convertDate(value);

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

function convertDate(date) {
	var jstDate = date;
	jstDate.setHours(jstDate.getHours() + 17); // TODO タイムゾーンに依存しないようにする

	return Utilities.formatDate(jstDate, "JST", "yyyyMMdd");
}

function getRegisteredUser(userName) {
	for ( var i = 0; i < registeredUsers.length; i++) {
		if (registeredUsers[i].name == userName) {
			return registeredUsers[i];
		}
	}

	return null;
}
