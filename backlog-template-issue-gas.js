function getTemplateIssues() {
	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = spreadSheet.getSheetByName(TEMPLATE_SHEET_NAME);
	var values = sheet.getSheetValues(ROW_START_INDEX, COLUMN_START_INDEX,
			sheet.getLastRow() - 1, sheet.getLastColumn());

	var issues = [];
	for ( var i = 0; i < values.length; i++) {
		var issue = {};
		for ( var j = 0; j < values[0].length; j++) {
			var columnName = sheet.getRange(ROW_HEADER_INDEX, j + 1).getValue();
			issue[convertToParam[columnName]] = values[i][j];
		}
		issues[i] = issue;
	}
}

TEMPLATE_SHEET_NAME = "Template";
ROW_HEADER_INDEX = 1;
ROW_START_INDEX = 2;
COLUMN_START_INDEX = 1;

convertToParam = {
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
