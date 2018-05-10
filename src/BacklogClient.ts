import HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse;
import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;

export class BacklogClient {
  private uri: string;
  private apiKey: string;
  constructor(spaceName: string, domain: string, apiKey: string) {
    this.uri = 'https://' + spaceName + '.backlog' + domain + '/api/v2/';
    this.apiKey = apiKey;
  }

  /**
   * プロジェクトキーを指定して、プロジェクトを取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project/
   *
   */
  public getProjectV2(projectKey) {
    return this.get('projects/' + projectKey);
  }

  /**
   * プロジェクトの参加メンバーを返します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project-user-list/
   *
   */
  public getUsersV2(apiKey, projectId) {
    return this.get('projects/' + projectId + '/users');
  }

  /**
   * 課題キーを指定して、課題を取得します。※親課題に*ではなく具体的な課題キーを指定した場合
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue/
   *
   */
  public getIssueV2(apiKey, issueId) {
    return this.get('issues/' + issueId);
  }

  /**
   * 課題を追加します。追加に成功した場合は、追加された課題が返ります。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/add-issue/
   *
   */
  public createIssueV2(apiKey, issue) {
    // TODO
    // if (issue["prorityId"] == undefined) {
    //   issue["priorityId"] = DEFAULT_PRIORITYID;
    // }
    return this.post('issues', issue);
  }

  /**
   * プロジェクトの種別一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
   *
   */
  public getIssueTypesV2(projectId) {
    return this.get('projects/' + projectId + '/issueTypes');
  }

  /**
   * プロジェクトのカテゴリ一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
   *
   */
  public getCategoriesV2(projectId) {
    return this.get('projects/' + projectId + '/categories');
  }

  /**
   * プロジェクトのマイルストーン一覧を取得します。
   *
   * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-type-list/
   *
   */
  public getVersionsV2(projectId) {
    return this.get('projects/' + projectId + '/versions');
  }

  private get(resource: string): any {
    let httpResponse = this.doRequest(resource);
    return this.parseResponse(httpResponse);
  }

  private post(resource: string, data: any): any {
    let options: URLFetchRequestOptions = {
      method: 'post',
      payload: data
    };
    let httpResponse = this.doRequest(resource, options);

    return this.parseResponse(httpResponse);
  }

  private doRequest(resource: string, options?: URLFetchRequestOptions): HTTPResponse {
    return UrlFetchApp.fetch(this.uri + resource + '?apiKey=' + this.apiKey, options);
  }

  private parseResponse(response: HTTPResponse): any {
    return JSON.parse(response.getContentText());
  }
}
