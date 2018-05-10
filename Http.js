/**
* HttpのGetリクエストを送信します
*
* @param {string} uri リクエストするURI
* @param {string} apiKey BacklogのAPIキー
* @return {Response} response レスポンスを返します 
*/ 
function httpGet(uri, apiKey) {
    var url = uri + "?apiKey=" + apiKey;
      
    logToSheet("httpGet", url);
    return UrlFetchApp.fetch(url);
  }
  
  /**
  * HttpのPostリクエストを送信します
  *
  * @param {string} uri リクエストするURI
  * @param {string} apiKey BacklogのAPIキー
  * @param {Object<string, number>} formData 送信するフォームデータ
  * @return {Response} response レスポンスを返します 
  */
  function httpPost(uri, apiKey, formData) {
    var url = uri + "?apiKey=" + apiKey;
    var param = {
      "method": "post",
      "payload" : formData
    };
    
    logToSheet("httpPost", url);
    return UrlFetchApp.fetch(url, param);
  }
  