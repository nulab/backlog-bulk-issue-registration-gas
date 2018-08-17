import {List} from "./List"
import {IssueType, Category, Version, Priority, User, CustomFieldDefinition} from "./datas"
import {IssueConverter, extractFromString} from "./IssueConverter"
import {Left} from "./Either"
import {None} from "./Option"

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
  const customFieldDefinitions: List<CustomFieldDefinition> = [
    CustomFieldDefinition(12345, 5, "string", None()),
    CustomFieldDefinition(12346, 3, "number", None())
  ]
  const converter = IssueConverter(10777, issueTypes, categories, versions, priorities, users, customFieldDefinitions)

  test("convert: input all", function () {
    const data = {summary: "データファイルを作成する", description: "step1\r\n\r\nstep2", startDate: "2018-04-16T15:00:00.000Z", dueDate: "2018-04-30T09:00:00.000Z", estimatedHours: "3", actualHours : "1.5", issueTypeName: "issue type 3", categoryNames: "category 1\ncategory 2 ", versionNames: "version 1", milestoneNames: "version 2", priorityName: "priority 1", assigneeName: "user 3", parentIssueId: "*",
      customFields: [{header: `=hyperlink("test.backlog.com/EditAttribute.action?attribute.id=12345","数字")`, value: "abc"}, {header: `=hyperlink("test.backlog.com/EditAttribute.action?attribute.id=12346","数字")`, value: "123"}]}
    const actual = converter.convert(data)
    actual.recover(function(error) {
      return Left(error)
    })
    expect(actual.isRight).toBe(true)
    actual.map(function (issue) {
      expect(issue.projectId).toBe(10777)
      expect(issue.summary).toBe("データファイルを作成する")
      issue.description.map(description => expect(description).toBe("step1\r\n\r\nstep2"))
      issue.startDate.map(startDate => expect(startDate).toEqual(new Date("2018-04-16T15:00:00.000Z")))
      issue.dueDate.map(dueDate => expect(dueDate).toEqual(new Date("2018-04-30T09:00:00.000Z")))
      issue.estimatedHours.map(estimatedHours => expect(estimatedHours).toBe(3))
      issue.actualHours.map(actualHours => expect(actualHours).toBe(1.5))
      expect(issue.issueType.id).toBe(3)
      expect(issue.categories.map(category => category.id)).toEqual([1, 2])
      expect(issue.versions.map(version => version.id)).toEqual([1])
      expect(issue.categories.map(category => category.id)).toEqual([1, 2])
      expect(issue.milestones.map(milestone => milestone.id)).toEqual([2])
      expect(issue.priority.id).toBe(1)
      issue.assignee.map(assignee => expect(assignee.id).toBe(3))
      issue.parentIssueId.map(parentIssueId => expect(parentIssueId).toBe("*"))
      expect(issue.customFields[0].id).toBe(12345)
      expect(issue.customFields[1].id).toBe(12346)
      expect(issue.customFields[0].fieldTypeId).toBe(5)
      expect(issue.customFields[1].fieldTypeId).toBe(3)
      expect(issue.customFields[0].value).toEqual("abc")
      expect(issue.customFields[1].value).toEqual("123")
    })
  })

  test("convert: invalid issue type", function () {
    const data = {projectId: 77777, summary: "課題を追加する", issueTypeName: "issue type 999", categoryNames: "", versionNames: "", milestoneNames: "", priorityName: "priority 2", customFields: []}
    const actual = converter.convert(data)
    expect(actual.isLeft).toBe(true)
    actual.recover(error => {
      expect(error.message).toEqual("IssueType not found. name: issue type 999")
      return Left(error)
    })
  })

  test("convert: default priority", function () {
    const data = {summary: "aaa", description: "", issueTypeName: "issue type 3", categoryNames: "", versionNames: "", milestoneNames: "", customFields: []}
    const actual = converter.convert(data)
    actual.recover(function(error) {
      return Left(error)
    })
    expect(actual.isRight).toBe(true)
    actual.map(function (issue) {
      expect(issue.issueType.id).toBe(3)
    })
  })

  test("convert: invalid priority", function () {
    const data = {summary: "aaa", description: "", issueTypeName: "issue type 3", priorityName: "priority 100", categoryNames: "", versionNames: "", milestoneNames: "", customFields: []}
    const actual = converter.convert(data)
    expect(actual.isLeft).toBe(true)
    actual.recover(function(error) {
      expect(error.message).toBe("Priority not found. name: priority 100")
      return Left(error)
    })
  })
})

describe("extractFromString", function () {

  test("valid custom field", function () {
    const actual = extractFromString(`=hyperlink("test.backlog.com/EditAttribute.action?attribute.id=12345","number field")`)
    expect(actual.isDefined).toBe(true)
    actual.map(function(id) {
      expect(id).toEqual(12345)
    })
  })
})
