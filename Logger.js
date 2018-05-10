/**
* Log用シートにログを1行追加します
*
* @param {string} type 1列目に出力したい文字列
* @param {string} value 2列目に出力したい文字列
*/
function logToSheet(type, value) {
  var logMsg = new Array();
    
  logMsg.push(new Date());
  logMsg.push(type);
  logMsg.push(value);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('log').appendRow(logMsg);
}
