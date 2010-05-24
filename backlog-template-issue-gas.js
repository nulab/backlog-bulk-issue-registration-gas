function createIssues() {
	var newIssues = getTemplateIssues();

	var issues = [];
	for ( var i = 0; i < newIssues.length; i++) {
		issues.push(createIssue(newIssues[i]));
	}
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
				issue[convertName[name]] = convertValue(name, values[i][j]);
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

	return request.send().parseXML(); // TODO Parseに時間かかるかもなので、要検証
}

function convertValue(name, value) {
	if (value.constructor == Date) {
		return convertDate(value);

	} else if (convertName[name] == "assignerId") {
		var user = getRegisteredUser(value);
		if (user != null) {
			return user.id;
		} else {
			Logger.log("Don't find registered user '" + value + "'!");
			return 0;
		}

	} else {
		return value;
	}
}

function convertDate(date) {
	var jstDate = date;
	jstDate.setHours(jstDate.getHours() + 17);

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

TEMPLATE_SHEET_NAME = "Template";
ROW_HEADER_INDEX = 1;
ROW_START_INDEX = 2;
COLUMN_START_INDEX = 1;

convertName = {
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
	"優先度ID" : "priority",
	"担当者ユーザ名" : "assignerId"
};

// TODO ユーザ入力受け取れるようにする
SPACE = "demo";
USERNAME = "demo";
PASSWORD = "demo";
PROJECT_KEY = "STWK";

REQUEST_URI = "https://" + SPACE + ".backlog.jp/XML-RPC";
