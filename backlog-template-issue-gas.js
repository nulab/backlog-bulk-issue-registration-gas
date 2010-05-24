function getTemplateIssues() {
	var issues = [];

	var project = getProject(PROJECT_KEY);

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
				issue[convertName[name]] = convertValue(values[i][j]);
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

function createIssue(issue) {
	var issue = getTemplateIssues()[0]; // TODO テスト用

	var request = new XmlRpcRequest(REQUEST_URI, "backlog.createIssue");
	request.setAuthentication(USERNAME, PASSWORD);
	request.addParam(issue);

	return request.send().parseXML();
}

function convertValue(value) {
	if (value.constructor == Date) {
		var jstDate = value;
		jstDate.setHours(jstDate.getHours() + 17);
		return Utilities.formatDate(jstDate, "JST", "yyyyMMdd");
	} else {
		return value;
	}
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
	"担当者ユーザ名" : "assignerId" // TODO assignerIdをassignerNameから取得する
};

// TODO ユーザ入力受け取れるようにする
SPACE = "demo";
USERNAME = "demo";
PASSWORD = "demo";
PROJECT_KEY = "STWK";

REQUEST_URI = "https://" + SPACE + ".backlog.jp/XML-RPC";
