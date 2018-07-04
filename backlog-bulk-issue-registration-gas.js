// https://developers.google.com/apps-script/reference/spreadsheet/

// ------------------------- 定数 -------------------------

/** スクリプト名 */
var SCRIPT_NAME = "課題一括登録";

/** スクリプトバージョン */
var SCRIPT_VERSION = "v2.0.0-SNAPSHOT";

/** データが記載されているシートの名前 */
var TEMPLATE_SHEET_NAME = "Template";

/** ヘッダ行のインデックス */
var ROW_HEADER_INDEX = 1;

/** 行のデフォルト長 */
var DEFAULT_COLUMN_LENGTH = 16;

// ------------------------- 関数 -------------------------

/**
 * フック関数：スプレッドシート読み込み時に起動されます
 */
function onOpen() {
	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var menuEntries = [ 
		{ name : "STEP1: Backlogからデータを取得する", functionName: "init" },
		{ name : "STEP2: 課題一括登録を実行", functionName : "main" }
	];

	spreadSheet.addMenu("Backlog", menuEntries);
}

/**
 * Backlogのプロジェクト情報を取得し、定義シートに出力します
 */
function init() {
	var app = createApplication_('Backlog 定義一覧取得', 360, 160);
	var grid = createGrid_(app);
	showInputDialog_(app, grid, "init_run_");
}

/**
 * スプレッドシートのデータを読み込んで、Backlogに課題を一括登録します
 */
function main() {
	var app = createApplication_('Backlog 課題一括登録', 360, 160);
	var grid = createGrid_(app);
	showInputDialog_(app, grid, "main_run_");
}

/**
 * UIアプリケーションオブジェクトを作成します
 */
function createApplication_(title, width, height) {
	var app = UiApp.createApplication();
	
	app.setTitle(title + " " + SCRIPT_VERSION);
	app.setWidth(width);
	app.setHeight(height);
	return app;
}

/**
 * パラメータ入力ダイアログを作成します
 */
function createGrid_(app) {
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
	grid.setWidget(1, 0, app.createLabel('APIキー'));
	grid.setWidget(1, 1, app.createTextBox().setName("apikey").setValue(lastUsername));
	grid.setWidget(2, 0, app.createLabel('プロジェクトキー'));
	grid.setWidget(2, 1, app.createTextBox().setName("projectKey").setValue(lastProjectKey));
	return grid;
}

/**
 * パラメータ入力ダイアログを表示します
 */
function showInputDialog_(app, grid, handlerName) {
	var panel = app.createVerticalPanel();
	var submitButton = app.createButton('実行');
	var submitHandler = app.createServerClickHandler(handlerName);	
  
	submitHandler.addCallbackElement(grid);
	submitButton.addClickHandler(submitHandler);
	panel.add(grid);
	panel.add(submitButton);
	app.add(panel);
	SpreadsheetApp.getActiveSpreadsheet().show(app);
}

/**
 * '一括登録'ボタンをクリックすることで呼び出されます
 */
function main_run_(grid) {
	var app = UiApp.getActiveApplication();
	var param = getParametersFromGrid(grid);
	var keyLength = DEFAULT_COLUMN_LENGTH;
	var summaryLength = DEFAULT_COLUMN_LENGTH;
	var current = Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");
	var sheetName = SCRIPT_NAME + " : " + current;
	var LOG_KEY_NUMBER = 1;
	var LOG_SUMMARY_NUMBER = 2;
	var onIssueCreated = function onIssueCreted(i, issue) {
		var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
		var issueKey = issue.issueKey;
		var summary = issue.summary;
		var fomula = '=hyperlink("' + param.space + ".backlog" + param.domain + "/" + "view/" + issueKey + '";"' + issueKey + '")';
		var currentRow = i + 1;

		if (logSheet == null)
			logSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName, 1);
		keyLength = Math.max(keyLength, strLength_(issueKey));
		summaryLength = Math.max(summaryLength, strLength_(summary));

		var keyWidth = calcWidth(keyLength);
		var summaryWidth = calcWidth(summaryLength);
		var keyCell = getCell(logSheet, LOG_KEY_NUMBER, currentRow);
		var summaryCell = getCell(logSheet, LOG_SUMMARY_NUMBER, currentRow);

		keyCell.setFormula(fomula).setFontColor("blue").setFontLine("underline");
		summaryCell.setValue(summary);
		setColumnWidth(logSheet, LOG_KEY_NUMBER, keyWidth);
		setColumnWidth(logSheet, LOG_SUMMARY_NUMBER, summaryWidth)
		SpreadsheetApp.flush();
	}
	var onWarn = function onWarn(message) {
		showMessage_(message);
	}

	// BacklogScript throws an exception on error
	showMessage_("データを収集しています...");
	var templateIssues = getTemplateIssuesFromSpreadSheet_();
	storeUserProperty(param)
	showMessage_("一括登録を開始しました...");
	BacklogScript.run(param.space, param.domain, param.apiKey, param.projectKey, templateIssues, onIssueCreated, onWarn);
	showMessage_(SCRIPT_NAME + " が正常に行われました");
	return app.close();
}

/**
 * Backlogプロジェクトの定義を取得します 
 */
function init_run_(grid) {
	var app = UiApp.getActiveApplication();
	var param = getParametersFromGrid(grid);
	var definition = BacklogScript.definitions(param.space, param.domain, param.apiKey, param.projectKey)
	var templateSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEMPLATE_SHEET_NAME);
	var issueTypeRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.issueTypeNames(), true).build();
	var categoryRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.categoryNames(), true).build();
	var versionRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.versionNames(), true).build();
	var priorityRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.priorityNames(), true).build();
	var userRule = SpreadsheetApp.newDataValidation().requireValueInList(definition.userNames(), true).build();
	var lastRow = templateSheet.getLastRow() - 1;
	var customFieldStartColumnNumber = 14; // N ~
	var currentColumnNumber = customFieldStartColumnNumber;

	storeUserProperty(param);
	templateSheet.getRange(2, 7, lastRow).setDataValidation(issueTypeRule); // 7 = G
	templateSheet.getRange(2, 8, lastRow).setDataValidation(categoryRule); 	// 8 = H
	templateSheet.getRange(2, 9, lastRow).setDataValidation(versionRule); 	// 9 = I
	templateSheet.getRange(2, 10, lastRow).setDataValidation(versionRule); 	// 10 = J
	templateSheet.getRange(2, 11, lastRow).setDataValidation(priorityRule); // 11 = K
	templateSheet.getRange(2, 12, lastRow).setDataValidation(userRule); 	// 12 = L
	for (var i = 0; i < definition.customFields.length; i++) {
		var customField = definition.customFields[i];
		var headerCell = getCell(templateSheet, currentColumnNumber, ROW_HEADER_INDEX);
		var columnName = headerCell.getValue();

		/**
		 * https://github.com/nulab/backlog4j/blob/master/src/main/java/com/nulabinc/backlog4j/CustomField.java#L10
		 * Text(1), TextArea(2), Numeric(3), Date(4), SingleList(5), MultipleList(6), CheckBox(7), Radio(8)
		 * We don't support the types MultipleList(6) and CheckBox(7), Radio(8)
		 */
		var customFieldName = "";

		if (customField.typeId >= 6)
			continue;
		switch(customField.typeId) {
			case 1:
				customFieldName = "文字列";
				break;
			case 2:
				customFieldName = "文章";
				break;
			case 3:
				customFieldName = "数値";
				break;
			case 4:
				customFieldName = "日付";
				break;
			case 5:
				customFieldName = "選択リスト";
				break;
		}
		if (columnName === "")
			templateSheet.insertColumnAfter(currentColumnNumber - 1);
		headerCell.setFormula(
			'=hyperlink("' + param.space + ".backlog" + param.domain + "/EditAttribute.action?attribute.id=" + customField.id + '";"' + customField.name + '(' + customFieldName + ')' + '")'
		);
		currentColumnNumber++;
	}
	showMessage_("Backlogの定義を取得完了しました");
	return app.close();
}

/**
 * Templateシートからすべての項目を課題配列に格納します
 */
function getTemplateIssuesFromSpreadSheet_() {
	var issues = [];
    var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = spreadSheet.getSheetByName(TEMPLATE_SHEET_NAME);
	var COLUMN_START_INDEX = 1; /** データ列の開始インデックス */
	var ROW_START_INDEX = 2;	/** データ行の開始インデックス */
	var columnLength = sheet.getLastColumn();
	var values = sheet.getSheetValues(
		ROW_START_INDEX, 
		COLUMN_START_INDEX,
		sheet.getLastRow() - 1, 
		columnLength
	);

	for ( var i = 0; i < values.length; i++) {
		var customFields = [];
		var customFieldIndex = 0;
		for (var j = 13; j < columnLength; j++) {
			if (values[i][j] !== "") {
				customFields[customFieldIndex] = {
					header: getCell(sheet, j + 1, 1).getFormula(),
					value: values[i][j]
				};
				customFieldIndex++;
			}
		}
		var issue = {
			summary: values[i][0] === "" ? undefined : values[i][0],
			description: values[i][1] === "" ? undefined : values[i][1],
			startDate: values[i][2] === "" ? undefined : values[i][2],
			dueDate: values[i][3] === "" ? undefined : values[i][3],
			estimatedHours: values[i][4] === "" ? undefined : values[i][4],
			actualHours: values[i][5] === "" ? undefined : values[i][5],
			issueTypeName: values[i][6] === "" ? undefined : values[i][6],
			categoryNames: values[i][7],
			versionNames: values[i][8],
			milestoneNames: values[i][9],
			priorityName: values[i][10] === "" ? undefined : values[i][10],
			assigneeName: values[i][11] === "" ? undefined : values[i][11],
			parentIssueKey: values[i][12] === "" ? undefined : values[i][12],
			customFields: customFields
		};
		issues[i] = issue;
	}
	return issues;
}

/**
 * Gridから入力パラメータを取得します
 * 
 * @param {*} grid 
 * @return {object} パラメータ
 */
function getParametersFromGrid(grid) {
	return {
		space: grid.parameter.space,
		domain: grid.parameter.domain,
		apiKey: grid.parameter.apikey,
		projectKey: grid.parameter.projectKey.toUpperCase()
	}
}

/**
 * User propertyに入力パラメータを保存します
 * 
 * @param {object} param パラメータ 
 */
function storeUserProperty(param) {
	setUserProperty("space", param.space);
	setUserProperty("domain", param.domain);
	setUserProperty("apikey", param.apiKey);
	setUserProperty("projectKey", param.projectKey);
}

/**
 * シート内の指定したセルを取得します
 * 
 * @param {*} sheet 
 * @param {*} column 列番号
 * @param {*} row 行番号
 */
function getCell(sheet, column, row) {
	return sheet.getRange(row, column)
}

/**
 * 文字数から文字幅を算出します
 * 
 * @param {number} length 文字数
 * @return {number} 文字幅
 */
function calcWidth(length) {
	var DEFAULT_FONT_SIZE = 10; 	/** フォントのデフォルトサイズ */
	var ADJUST_WIDTH_FACTOR = 0.75; /** 列幅調整時の係数 */
	return length * DEFAULT_FONT_SIZE * ADJUST_WIDTH_FACTOR;
}

/**
 * シート列の幅を指定します
 * 
 * @param {*} sheet 
 * @param {number} column 列番号 
 * @param {number} width 幅
 */
function setColumnWidth(sheet, column, width) {
	sheet.setColumnWidth(column, width);
}

/**
 * text の文字数を算出します
 * 
 * @param {string} 文字列 
 * @return {string} 調整済み文字数
 */
function strLength_(text) {
	var count = 0;

	for (var i = 0; i < text.length; i++) {
		var n = escape(text.charAt(i));
		if (n.length < 4)
			count += 1;
		else
			count += 2;
	}
	return count;
}

/**
 * ユーザープロパティをキーで取得します
 *
 * @param {string} key 取得したいプロパティキー名
 * @return {string} 対応する値 
 */
function getUserProperty(key) {
    return PropertiesService.getUserProperties().getProperty("bti." + key);
}

/**
 * ユーザープロパティをキーで設定します
 *
 * @param {string} key 設定したいプロパティキー名
 * @return {string} 対応する値 
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
