import {ApiValidation} from "../ApiValidation"
import {Left} from "../Either"

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
      expect(error.message).toEqual("プロジェクトを入力してください")
      return Left(error)
    })
    expect(actual.isLeft).toBe(true)
  })
})
