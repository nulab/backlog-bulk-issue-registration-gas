import {Http} from "./Http"
import {DateFormatter, BacklogClientImpl} from "./BacklogClient"
import {getProject} from "./BacklogService"
import {Left} from "./Either"

class FakeHttp implements Http {
  public get(uri: string): JSON {
    return this.toJson("{}")
  }
  public post(uri: string, data: any): JSON {
    return this.toJson("{}")
  }
  private toJson(text): JSON {
    return JSON.parse(text)
  }
}

class FakeDateFormatter implements DateFormatter {
  public dateToString = (date: Date): string => ""
}

describe("BacklogService", function () {
  const client = new BacklogClientImpl(new FakeHttp, "testspace", ".jp", "testapikeystring", new FakeDateFormatter)

  test("getProject: project key is empty", function () {
    const actual = getProject(client, "", "en")

    expect(actual.isLeft).toBe(true)
    actual.recover(function(error) {
      expect(error.message).toBe("Project key is required")
      return Left(error)
    })
  })
})
