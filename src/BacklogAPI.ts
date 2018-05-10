export class BacklogAPI {
  constructor(uri: String, apiKey: String) {}

  /**
   * プロジェクトキーを指定して、プロジェクトを取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project/
   *
   */
  public getProjectV2(projectKey) {
    var uri = uri + 'projects/' + projectKey;
    var response = httpGet(uri, apiKey);

    return JSON.parse(response.getContentText());
  }

  private static doRequest(resource: String, param: HttpParam): String {
    return UrlFetchApp.fetch(url, param);
  }
}

class HttpParam {

}


/**
* プロジェクトの参加メンバーを返します。
*
* @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project-user-list/
*
*/

function getUsersV2(apiKey, projectId) {
  var uri = getRequestUri_V2() + "projects/" + projectId + "/users";
  var response = httpGet(uri, apiKey);

  return JSON.parse(response.getContentText());
}

/**
* 課題を追加します。追加に成功した場合は、追加された課題が返ります。
*
* @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/add-issue/
*
*/

function createIssueV2(apiKey, issue) {
  if (issue["prorityId"] == undefined) {
    issue["priorityId"] = DEFAULT_PRIORITYID;
  }

  var uri = getRequestUri_V2() + "issues";  
  var response = httpPost(uri, apiKey, issue);

  return JSON.parse(response.getContentText());
}

/**
* 課題キーを指定して、課題を取得します。※親課題に*ではなく具体的な課題キーを指定した場合
*
* @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue/
*
*/

function getIssueV2(apiKey, issueId) {
  var uri = getRequestUri_V2() + "issues/" + issueId;
  var response = httpGet(uri, apiKey);

  return JSON.parse(response.getContentText());
}

/**
* プロジェクトの種別一覧を取得します。
*
* @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
*
*/

function getIssueTypesV2(apiKey, projectId) {
  var uri = getRequestUri_V2() + "projects/" + projectId + "/issueTypes";
  var response = httpGet(uri, apiKey);

  return JSON.parse(response.getContentText()); 
}

/**
* プロジェクトのカテゴリ一覧を取得します。
*
* @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
*
*/

function getCategoriesV2(apiKey, projectId) {
  var uri = getRequestUri_V2() + "projects/" + projectId + "/categories";
  var response = httpGet(uri, apiKey);

  return JSON.parse(response.getContentText());
}

/**
* プロジェクトのマイルストーン一覧を取得します。
*
* @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
*
*/

function getVersionsV2(apiKey, projectId) {
  var uri = getRequestUri_V2() + "projects/" + projectId + "/versions";
  var response = httpGet(uri, apiKey);

  return JSON.parse(response.getContentText());
}

function getRequestUri_V2() {
  return "https://" + getUserProperty("space") + ".backlog"+ getUserProperty("domain") + "/api/v2/";
}
