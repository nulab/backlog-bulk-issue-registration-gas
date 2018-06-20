# 概要

このプログラムは、Google ドキュメント（スプレッドシート）を基に、Backlogへ課題を一括登録するものです。TracのTicketImportPluginの、Googleドキュメント + Backlogバージョンです。

以下の場合に、特に効果を発揮すると思います。
* 初期プロジェクト立ち上げ時に、定型のタスクを登録する必要があるとき
* （運用・保守時など）定期的に同じタスクを行わなければならないとき

![](https://cacoo.com/diagrams/jv257uekYrdc9Uep-169AF.png)

# インストール

テンプレートとなるスプレッドシートを準備します。下記リンクをクリックして、スプレッドシートをコピーしてください。
* [https://docs.google.com/spreadsheets/d/1BkQm3TD4BF0NuqGTQgW9jedFp1_QtcuDEYWCyQJ3s4c/copy]
* Googleにログインしていない場合、コピー時にエラーとなる場合があります。その際は、ログインして少し時間を置いてから再度お試しください。

# 入力項目について

テンプレートを元に、スプレッドシートの内容を登録したい情報に書き換えます。１行目のヘッダー行は、登録処理に必要な情報を含んでいるため、削除したり内容を変更しないようご注意ください。また「件名」「種別」は登録に必須となる項目ですので、必ず記入するようにしてください。優先度が入力されていない場合は「優先度中」が設定されます。

# 実行方法

スプレッドシートを開いて10秒ほど待つと、スプレッドシートのメニューバーの一番右に「Backlog」というメニューが追加されているかと思います。  

![](https://github.com/nulab/backlog-template-issue-gas/wiki/images/menu.png)

実行には2ステップが必要です。以下の手順で実行してください。  
下記のような承認画面が出ることがあるかもしれませんが、こちらは”OK”を押して続行後、再度課題一括登録を実行してみてください。

![](https://cacoo.com/diagrams/jv257uekYrdc9Uep-D9EC2.png)

## STEP1: Backlogからデータを取得する
この手順では、Backlogに設定済みの定義(種別名、ユーザー名等)を取得します。この設定済み定義を用いて選択式リストの構築を行いますので、Backlog側の定義を変更した場合は必ずそのたびに実行してください。  

[Backlog]メニューから[STEP1:Backlogからデータを取得する]をクリックします。

![](https://github.com/nulab/backlog-template-issue-gas/wiki/images/menu_step1.png)

下記のような入力ダイアログが表示されますので、順に必要な情報を入力してください。2回目以降の実行時には、前回入力した情報がセットされた状態で表示されます。
- BacklogのスペースID
- BacklogのAPIキー: https://backlog.com/ja/help/usersguide/personal-settings/userguide2378/
- 登録対象となるBacklogのプロジェクトキー

![](https://github.com/nulab/backlog-template-issue-gas/wiki/images/form_step1.png)

上記情報を全て入力後、`実行`ボタンをクリックして定義一覧取得を実行します。

## STEP2: 一括登録処理を実行する
[Backlog]メニューから[STEP2:課題一括登録を実行]をクリックします。

![](https://github.com/nulab/backlog-template-issue-gas/wiki/images/menu_step2.png)

下記のような入力ダイアログが表示されますが、`STEP1`で既に入力済みなので`実行`ボタンをクリックして一括登録処理を実行します。

![](https://github.com/nulab/backlog-template-issue-gas/wiki/images/form_step2.png)

登録処理実行時に、結果出力用のシートが新規作成され自動的にそのシートに遷移します。このシートで、一括登録された課題の（キー・件名）を一覧で確認することができます。

![](https://cacoo.com/diagrams/jv257uekYrdc9Uep-5C111.png)

## 検証用Backlogプロジェクト

検証用のBacklogアカウントを持っていない人は、下記ユーザ情報を使えば[Backlogデモプロジェクト](https://demo.backlog.jp/)にて試すことができます。

* スペースID： `demo`.backlog.`jp`
* APIキー： `ShMb0ao0AQuwzysKGEvLu9kZ96UczRSUufi9dXVFTKAtIY4ODiljBnYs9SBBb1bj`
* プロジェクトキー： `STWK`