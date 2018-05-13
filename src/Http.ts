import HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse
import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions

export interface Http {
  get: (uri: string) => any,
  post: (uri: string, payload: JSON) => any
  doRequest: (uri: string) => HTTPResponse
  toJson: (response: HTTPResponse) => JSON
}

export const Http = (): Http => ({

  get: (uri: string): any => {
    let httpResponse = this.doRequest(uri)
    return this.toJson(httpResponse)
  },

  post: (uri: string, data: any): JSON => {
    const options: URLFetchRequestOptions = {
      method: "post",
      payload: data
    }
    const httpResponse = this.doRequest(uri, options)

    return this.toJson(httpResponse)
  },

  doRequest: (uri: string, options?: URLFetchRequestOptions): HTTPResponse => {
    if (options == null) return UrlFetchApp.fetch(uri)
    else return UrlFetchApp.fetch(uri, options)
  },

  toJson(response: HTTPResponse): JSON {
    return JSON.parse(response.getContentText())
  }
})
