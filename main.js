// https://developers.google.com/apps-script/reference/spreadsheet/

/**
 * フック関数：スプレッドシート読み込み時に起動されます
 */
function onOpen() {
	SpreadsheetApp.getActiveSpreadsheet()
		.addMenu(
			"Backlog",
			[ 
				{ 
					name : BacklogScript.getMessage("menu_step1"), 
					functionName: "init"
				},
				{ 
					name : BacklogScript.getMessage("menu_step2"),
					functionName : "main"
				}
			]
		)
}

/**
 * Backlogのプロジェクト情報を取得し、定義シートに出力します
 */
function init() {
	BacklogScript.showInitDialog();
}

/**
 * スプレッドシートのデータを読み込んで、Backlogに課題を一括登録します
 */
function main() {
	BacklogScript.showRunDialog();
}

/**
 * '一括登録'ボタンをクリックすることで呼び出されます
 */
function main_run_() {
	BacklogScript.run();
}

/**
 * Backlogプロジェクトの定義を取得します 
 */
function init_run_() {
	BacklogScript.getDefinitions();
}
