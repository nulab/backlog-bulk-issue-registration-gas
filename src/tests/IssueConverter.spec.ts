import {List} from "../List"
import {IssueType, Category, Version, Priority, User} from "../datas"
import {IssueConverter} from "../IssueConverter"
import {Left} from "../Either"

describe("IssueConverter", function () {

  const issueTypes: List<IssueType> = [
    IssueType(1, "issue type 1"),
    IssueType(2, "issue type 2"),
    IssueType(3, "issue type 3")
  ]
  const categories: List<Category> = [
    Category(1, "category 1"),
    Category(2, "category 2")
  ]
  const versions: List<Version> = [
    Version(1, "version 1"),
    Version(2, "version 2"),
    Version(3, "version 3")
  ]
  const priorities: List<Priority> = [
    Priority(1, "priority 1"),
    Priority(2, "priority 2"),
    Priority(3, "priority 3")
  ]
  const users: List<User> = [
    User(1, "user 1"),
    User(2, "user 2"),
    User(3, "user 3"),
    User(4, "user 4")
  ]
  const converter = IssueConverter(issueTypes, categories, versions, priorities, users)

  test("test1", function () {
    const data = {projectId: 86095, summary: "データファイルを作成する", description: "step1\r\n\r\nstep2", startDate: "", dueDate: "2018-04-30T15:00:00.000Z", estimatedHours: "", actualHours : "", issueTypeName: "issue type 3", categoryNames: "category 1\ncategory 2 ", versionNames: "", milestoneNames: "", priorityId: "3", assigneeName: "shomatan", parentIssueId: "*"}
    const actual = converter.convert(data)
    actual.recover(function(error) {
      console.log(error)
      return Left(error)
    })
    expect(actual.isRight).toBe(true)
  })
})
