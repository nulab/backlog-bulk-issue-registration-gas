import HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse
import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions
import {Http, HttpClient} from "../Http"
import {BacklogClient, BacklogClientImpl} from "../BacklogClient"

describe("BacklogClient", function () {

  class FakeHttp implements Http {
    public get(uri: string): JSON {
      if (uri === "projects/SPR") {
        return this.toJson(this.getProject())
      }
      return this.toJson("{}")
    }
    public post(uri: string, data: any): JSON {
      return this.toJson("{}")
    }
    private toJson(text): JSON {
      return JSON.parse(text)
    }

    private getProject(): string {
      return `{
          "id": 12345,
          "projectKey": "SPR",
          "name": "SPR",
          "chartEnabled": true,
          "subtaskingEnabled": true,
          "projectLeaderCanEditProjectLeader": false,
          "useWikiTreeView": true,
          "textFormattingRule": "backlog",
          "archived": false,
          "displayOrder": 2147483646
        }`
    }
  }

  test("Get project", function () {
    const client = new BacklogClientImpl(new FakeHttp(), "testspace", ".jp", "testapikeystring")
    const maybeProject = client.getProjectV2("SPR")
    expect(maybeProject.isDefined)
    expect(maybeProject.get().projectKey === "SPR")
  })
})
