/**
* ユーザープロパティをキーで取得します
*
* @param {string} key 取得したいプロパティキー名
* @return {string} value 対応する値 
*/
function getUserProperty(key) {
  return PropertiesService.getUserProperties().getProperty("bti." + key);
}
    