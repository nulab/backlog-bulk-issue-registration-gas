
export const Message = {
  findByKey: (key: string, locale: string): string => messages[key][locale],
  scriptName: (locale: string): string => this.findByKey("scriptName", locale),
  title_init: (locale: string): string => this.findByKey("title_init", locale),
  title_run: (locale: string): string => this.findByKey("title_run", locale),
  menu_step1: (locale: string): string => this.findByKey("menu_step1", locale),
  menu_step2: (locale: string): string => this.findByKey("menu_step2", locale),
  complete_init: (locale: string): string => this.findByKey("complete_init", locale),
  label_spaceId: (locale: string): string => this.findByKey("label_spaceId", locale),
  label_apiKey: (locale: string): string => this.findByKey("label_apiKey", locale),
  label_projectKey: (locale: string): string => this.findByKey("label_projectKey", locale),
  button_execute: (locale: string): string => this.findByKey("button_execute", locale),
  progress_collect: (locale: string): string => this.findByKey("progress_collect", locale),
  progress_begin: (locale: string): string => this.findByKey("progress_begin", locale),
  progress_end: (locale: string): string => this.findByKey("progress_end", locale)
}

const messages = {
	"scriptName": {
		"en": "Bulk issue registration",
		"ja": "課題一括登録"
	},
	"title_init" : {
		"en": "Backlog Acquire data from Backlog",
		"ja": "Backlog 定義一覧取得"
	},
	"title_run" : {
		"en": "Backlog Execute bulk registration processing",
		"ja": "Backlog 課題一括登録"
	},
	"menu_step1" : {
		"en": "STEP1: Acquire data from Backlog",
		"ja": "STEP1: Backlogからデータを取得する"
	},
	"menu_step2" : {
		"en": "STEP 2: Execute bulk registration processing",
		"ja": "STEP2: 課題一括登録を実行"
	},
	"complete_init" : {
		"en": "Acquired the definition of Backlog",
		"ja": "Backlogの定義を取得完了しました"
	},
	"label_spaceId" : {
		"en": "Space ID",
		"ja": "スペースID"
	},
	"label_apiKey" : {
		"en": "API key",
		"ja": "APIキー"
	},
	"label_projectKey" : {
		"en": "Project key",
		"ja": "プロジェクトキー"
	},
	"button_execute" : {
		"en": "Execute",
		"ja": "実行"
	},
	"progress_collect" : {
		"en": "Collecting data...",
		"ja": "データを収集しています..."
	},
	"progress_begin" : {
		"en": "Begin bulk registration process",
		"ja": "一括登録を開始しました..."
	},
	"progress_end" : {
		"en": " has been finished",
		"ja": " が正常に行われました"
	}
};
