function getTemplateIssues() {
	var issues = [];

	var project = getProject("STWK"); // TODO Keyの外部化

	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = spreadSheet.getSheetByName(TEMPLATE_SHEET_NAME);
	var values = sheet.getSheetValues(ROW_START_INDEX, COLUMN_START_INDEX,
			sheet.getLastRow() - 1, sheet.getLastColumn());

	for ( var i = 0; i < values.length; i++) {
		var issue = {
			projectId : project.id
		};
		for ( var j = 0; j < values[0].length; j++) {
			var columnName = sheet.getRange(ROW_HEADER_INDEX, j + 1).getValue();
			issue[convertToParam[columnName]] = values[i][j];
		}
		issues[i] = issue;
	}

	return issues;
}

function getProject(projectKey) {
	// TODO スペース・ID・パスワードの外部化
	var request = new XmlRpcRequest("https://demo.backlog.jp/XML-RPC",
			"backlog.getProject");
	request.addParam(projectKey);
	request.setAuthentication("demo", "demo");

	return request.send().parseXML();
}

function createIssues(issues) {

}
