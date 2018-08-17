import {Some, None} from "./Option"

describe("Option.equals", function () {

  test("The same value as Some is true", function () {
    const dataStr = Some("abc")
    expect(true).toBe(dataStr.equals(Some("abc")))
    expect(false).toBe(dataStr.equals(Some("bbv")))

    const dataNum = Some(123)
    expect(true).toBe(dataNum.equals(Some(123)))
    expect(false).toBe(dataNum.equals(Some(1234)))
  })

  test("Some != None", function () {
    const actual = Some("abcde")
    expect(false).toBe(actual.equals(None<string>()))
  })

})
