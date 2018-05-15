import {Validation} from "../Validation"
import {Left} from "../Either"

describe("Validation", function () {

  test("parameter: space is empty", function () {
    const actual = Validation().parameters("", "aaa", "bbb")
    expect(actual.isLeft).toBe(true)
  })
  test("parameter: apiKey is empty", function () {
    const actual = Validation().parameters("aaa", "", "bbb")
    expect(actual.isLeft).toBe(true)
  })
  test("parameter: projectKey is empty", function () {
    const actual = Validation().parameters("aaa", "bbb", "")
    expect(actual.isLeft).toBe(true)
  })

})
