import HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse
import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions

export interface Http {
  get: (uri: string) => JSON,
  post: (uri: string, payload: any) => JSON
}

export class HttpClient implements Http {

  public get(uri: string): JSON {
    let httpResponse = this.doRequest(uri)
    return this.toJson(httpResponse)
  }

  public post(uri: string, data: any): JSON {
    const options: URLFetchRequestOptions = {
      method: "post",
      payload: data
    }
    const httpResponse = this.doRequest(uri, options)
    return this.toJson(httpResponse)
  }

  private doRequest(uri: string, options?: URLFetchRequestOptions): HTTPResponse {
    if (options == null) return UrlFetchApp.fetch(uri)
    else return UrlFetchApp.fetch(uri, options)
  }

  private toJson(response: HTTPResponse): JSON {
    return JSON.parse(response.getContentText())
  }
}
