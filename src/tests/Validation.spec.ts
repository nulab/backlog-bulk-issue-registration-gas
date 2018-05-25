import {ApiValidation} from "../ApiValidation"
import {Left, Either, Right} from "../Either"
import {Http} from "../Http"
import {BacklogClient} from "../BacklogClient"
import {Key, Project, Id, Issue, User, IssueType, Category, Version, Priority} from "../datas"
import {Option, None} from "../Option"

describe("Validation", function () {

  test("parameter: space is empty", function () {
    const actual = ApiValidation().parameters("", "aaa", "bbb")
    actual.recover(error => {
      expect(error.message).toEqual("スペースURLを入力してください")
      return Left(error)
    })
    expect(actual.isLeft).toBe(true)
  })
  test("parameter: apiKey is empty", function () {
    const actual = ApiValidation().parameters("aaa", "", "bbb")
    actual.recover(error => {
      expect(error.message).toEqual("APIキーを入力してください")
      return Left(error)
    })
    expect(actual.isLeft).toBe(true)
  })
  test("parameter: projectKey is empty", function () {
    const actual = ApiValidation().parameters("aaa", "bbb", "")
    actual.recover(error => {
      expect(error.message).toEqual("プロジェクトキーを入力してください")
      return Left(error)
    })
    expect(actual.isLeft).toBe(true)
  })
})

describe("Validation", function () {

  class BacklogClientTest implements BacklogClient {
    private spaceName: string
    private domain: string
    private apiKey: string
    constructor(spaceName: string, domain: string, apiKey: string) {
      this.spaceName = spaceName
      this.domain = domain
      this.apiKey = apiKey
    }
    public getProjectV2(key: Key<Project>): Either<Error, Project> {
      if (this.spaceName !== "space")
        return Left(Error("api client returned code 404."))
      if (this.domain !== ".com")
        return Left(Error("api client returned code 404."))
      if (key !== "key")
        return Left(Error("api client returned code 404."))
      if (this.apiKey !== "abcd1234")
        return Left(Error("api client returned code 401."))
      return Right(Project(123, "key"))
    }
    public getIssueV2(id: Id<Issue>): Option<Issue> { return None() }
    public createIssueV2(issue: Issue): Either<Error, Issue> { return Left(Error("")) }
    public getUsersV2(id: Id<Project>): User[] { return [] }
    public getIssueTypesV2(id: Id<Project>): IssueType[] { return [] }
    public getCategoriesV2(id: Id<Project>): Category[] { return [] }
    public getVersionsV2(id: Id<Project>): Version[] { return [] }
    public getPrioritiesV2(): Priority[] { return [] }
  }

  test("wrong space key", function () {
    const client = new BacklogClientTest("aaa", "bbb", "ccc")
    const actual = ApiValidation().apiAccess(client, "ddd")
    expect(actual.isLeft).toBe(true)
    actual.recover(error => {
      expect(error.message).toEqual("スペースまたはプロジェクトが見つかりません")
      return Left(error)
    })
  })

  test("wrong domain", function () {
    const client = new BacklogClientTest("space", "bbb", "ccc")
    const actual = ApiValidation().apiAccess(client, "ddd")
    expect(actual.isLeft).toBe(true)
    actual.recover(error => {
      expect(error.message).toEqual("スペースまたはプロジェクトが見つかりません")
      return Left(error)
    })
  })

  test("wrong project key", function () {
    const client = new BacklogClientTest("space", ".com", "abcd1234")
    const actual = ApiValidation().apiAccess(client, "keya")
    expect(actual.isLeft).toBe(true)
    actual.recover(error => {
      expect(error.message).toEqual("スペースまたはプロジェクトが見つかりません")
      return Left(error)
    })
  })

  test("wrong API key", function () {
    const client = new BacklogClientTest("space", ".com", "abcd12345")
    const actual = ApiValidation().apiAccess(client, "key")
    expect(actual.isLeft).toBe(true)
    actual.recover(error => {
      expect(error.message).toEqual("認証に失敗しました")
      return Left(error)
    })
  })
})
