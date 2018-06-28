# Backlog bulk issue registration for Google Apps Script
(English document is described after Japanese)  

Googleドキュメント（スプレッドシート）をつかって、Backlogへ課題を一括登録するツールです。

以下のような場合に、お使いいただけます。

* プロジェクト立ち上げ時に、定型のタスクを登録する必要があるとき
* 運用・保守など、定期的に同じタスクを行わなければならないとき

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/about.png">

## インストール

テンプレートとなるスプレッドシートを準備します。下記リンクをクリックして、スプレッドシートをコピーしてください。
* <a href="https://docs.google.com/spreadsheets/d/1ih_pC9s4SjCbsB54ulyWrFIlqF4kwWv63j7PVOrBV8Q/copy" target="_blank">スプレッドシートをコピー(新しいタブで開いてください)</a>
* Googleにログインしていない場合、コピー時にエラーとなる場合があります。その際は、ログインして少し時間を置いてから再度お試しください。

## 入力項目について

テンプレートを元に、スプレッドシートの内容を登録したい情報に書き換えます。１行目のヘッダー行は、登録処理に必要な情報を含んでいるため、削除したり内容を変更しないようご注意ください。また「件名」「種別」は登録に必須となる項目ですので、必ず記入するようにしてください。

### 親課題
親課題が既に存在する場合は`課題キー`を指定してください。スプレッドシート内の課題を指定する場合は課題キーがまだ存在しないので、`*`を入力することで直近の親課題を指定していない課題を親課題とします。

## 実行方法

スプレッドシートを開いて10秒ほど待つと、スプレッドシートのメニューバーの一番右に「Backlog」というメニューが追加されます。

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/menu.png" width="553" height="114">

実行には2つのステップが必要です。下記のSTEP1から順番に実行してください。
途中で承認画面が出ることがあるかもしれませんが、こちらは”赤枠内のボタン”を押して続行後、再度課題一括登録を実行してみてください。

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/auth_require.png" width="350" height="137">

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/auth.png" width="500" height="500">



### STEP1: Backlogからデータを取得する
STEP1では、Backlogに設定済みの定義(種別名、ユーザー名等)を取得します。

[Backlog]メニューから[STEP1:Backlogからデータを取得する]をクリックします。

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/form_step1.png" width="461" height="273">

下記のような入力ダイアログが表示されますので、順に必要な情報を入力してください。
- BacklogのスペースID
- BacklogのAPIキー: https://backlog.com/ja/help/usersguide/personal-settings/userguide2378/
- 登録対象となるBacklogのプロジェクトキー

**デモ用Backlogプロジェクト**

お試しで使いたい方は[Backlogデモプロジェクト](https://demo.backlog.jp/) からお試しいただけます。( **大事な情報を入力しないようにご注意ください!!** )

* スペースID： `demo`.backlog.`jp`
* APIキー： `ShMb0ao0AQuwzysKGEvLu9kZ96UczRSUufi9dXVFTKAtIY4ODiljBnYs9SBBb1bj`
* プロジェクトキー： `STWK`

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/form_step1.png" width="461" height="273">

必要な情報を全て入力後、`実行`ボタンをクリックして定義一覧取得を実行します。  
正常に完了すると、右下に完了のポップアップが表示されます。

課題種別や、カテゴリーなど、必要な情報が選択できるようになっていることをご確認ください。

### スプレッドシートに課題を記入する

一括登録したい課題を1行に1課題ずつ入力してください。

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/about.png">


### STEP2: 一括登録処理を実行する
STEP2を実行することで、スプレッドシートに入力した内容で、Backlogに課題を一括登録します。

[Backlog]メニューから[STEP2:課題一括登録を実行]をクリックします。

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/menu_step2.png" width="388" height="117">

下記のような入力ダイアログが表示されますが、`STEP1`で既に入力済みなので`実行`ボタンをクリックして一括登録処理を実行します。

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/form_step2.png" width="461" height="273">

登録処理実行時に、結果出力用のシートが新規作成され自動的にそのシートに遷移します。このシートで、一括登録された課題の（キー・件名）を一覧で確認することができます。

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/log_sheet.png" width="445" height="182">

Backlogをの課題一覧を開くと、課題が登録されていることを確認できます。

![](https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/result.png)

## 一度作ったスプレッドシートを再利用する場合

Backlog側のプロジェクト設定を変更しなければ、STEP2の操作だけで課題は登録されます。
もしも課題種別やカテゴリーなど、変更がある場合はSTEP1の操作から実行してください。


# Backlog bulk issue registration for Google Apps Script

It is a tool to bulk register issues to Backlog using Google Docs (spreadsheet).

You can use it in the following cases.

* When you need to register fixed tasks at project launch
* When you have to perform the same task on a regular basis, such as operation / maintenance

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/about.png">

## Installation

Prepare the spreadsheet as a template. Please click the link below and copy the spreadsheet.
* <a href="https://docs.google.com/spreadsheets/d/1ih_pC9s4SjCbsB54ulyWrFIlqF4kwWv63j7PVOrBV8Q/copy" target="_blank">Copy spreadsheet (please open in new tab)</a>
* If you are not logged into Google, you may get an error when copying. In that case, please login and try some time after a while.

## About input items

Based on the template, rewrite the contents of the spreadsheet to the information you want to register. Please note that the header line of the first line contains information necessary for registration processing, so please do not delete it or change its contents. Also, "Summary" "Issue Type" is an indispensable item for registration, so please be sure to complete it.

### Parent issue
If the parent issue already exists, please specify `issue key`. Since issue key does not exist yet when specifying issues in the spreadsheet, entering `*` will make issues that do not specify the most recent parent issue as parent issues.

## How to execute

After opening the spreadsheet and waiting for about 10 seconds, the menu "Backlog" is added to the far right of the spreadsheet menu bar.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/menu.png" width="553" height="114">

Execution requires two steps. Please execute in order from STEP 1 below.
Although there may be cases where an approval screen appears on the way, please press the "button in the red frame" here and proceed to execute the bulk registration once again after continuing.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/auth_require.png" width="350" height="137">

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/auth.png" width="500" height="500">



### STEP 1: Acquire data from Backlog
In STEP 1, we obtain the definitions (issue type name, user name etc.) set in Backlog.

Click [STEP 1: Acquire data from Backlog] from the [Backlog] menu.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/form_step1.png" width="461" height="273">

The following input dialog will be displayed, so please enter the necessary information in order.
- Space ID of Backlog
- Backlog API key: https://backlog.com/en/help/usersguide/personal-settings/userguide 2378/
- Project key of Backlog to be registered

**Demo Backlog Project**

If you would like to use it for trial, you can try it from the [Backlog Demo Project] (https://demo.backlog.jp/). (** Please be careful not to enter important information !! **)

* Space ID: `demo`.backlog.`jp`
* API key: `ShMb0ao0AQuwzysKGEvLu9kZ96UczRSUufi9dXVFTKAtIY4ODiljBnYs9SBBb1bj`
* Project key: `STWK`

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/form_step1.png" width="461" height="273">

After entering all necessary information, click on the 'Execute' button to execute the definition list acquisition.
Upon successful completion, a completion popup will appear in the lower right.

Please confirm that you can select necessary information such as task type and category.

### Fill in the issue in the spreadsheet

Please enter the issue you want to register in bulk one line per line.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/about.png">


### STEP 2: Execute bulk registration processing
By executing STEP 2, you can register issues in Backlog at once with the contents entered in the spreadsheet.

From the [Backlog] menu, click [STEP 2: Execute bulk issue registration].

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/menu_step2.png" width="388" height="117">

The following input dialog is displayed, but since it has already been entered in `STEP 1`, click on the 'Execute' button and execute the bulk registration process.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/form_step2.png" width="461" height="273">

When the registration process is executed, a sheet for the result output is newly created and it automatically transits to that sheet. With this sheet, you can confirm the (issue key / summary) of the issue that was registered at once by a list.

<img src="https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/log_sheet.png" width="445" height="182">

When you open the issue list of Backlog, you can confirm that the issue is registered.

![](https://github.com/nulab/backlog-bulk-issue-registration-gas/wiki/images/result.png)

## When reusing a spreadsheet once made

If you do not change the project settings on the Backlog side, issues will be registered only by the operation in STEP 2.
If there are changes such as issue type and category, please execute from the operation in STEP 1.