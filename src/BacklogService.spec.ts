import {Http} from "./Http"
import {DateFormatter, BacklogClientImpl} from "./BacklogClient"
import {getProject, validate, relatedIssueTypes, relatedCustomFieldDefinitions} from "./BacklogService"
import {Left} from "./Either"
import {Message} from './resources'

class FakeHttp implements Http {
  public get(uri: string): JSON {
    if (uri === "https://testspace.backlog.jp/api/v2/projects/12345/issueTypes?apiKey=testapikeystring") {
      return this.toJson(this.getIssueTypes())
    }
    if (uri === "https://testspace.backlog.jp/api/v2/projects/12345/customFields?apiKey=testapikeystring") {
      return this.toJson(this.getCustomFields())
    }
    return this.toJson("{}")
  }
  public post(uri: string, data: any): JSON {
    return this.toJson("{}")
  }
  private toJson(text): JSON {
    return JSON.parse(text)
  }
  private getIssueTypes(): string {
    return `[
      {
        "id": 12200,
        "projectId": 12345,
        "name": "Task",
        "color": "#7ea800",
        "displayOrder": 0
      },
      {
        "id": 12201,
        "projectId": 12345,
        "name": "Bug",
        "color": "#990000",
        "displayOrder": 1
      },
      {
        "id": 12202,
        "projectId": 12345,
        "name": "Request",
        "color": "#ff9200",
        "displayOrder": 2
      }]`
  }
  private getCustomFields(): string {
    return `[
      {
        "id":339943,
        "version":1639647169000,
        "typeId":6,
        "name":"multilistfield",
        "description":"",
        "required":true,
        "useIssueType":true,
        "applicableIssueTypes":[12202],
        "displayOrder":2147483646,
        "allowAddItem":false,
        "items": [
          {
            "id": 1,
            "name": "list1",
            "displayOrder": 0
          },
          {
            "id": 2,
            "name": "list2",
            "displayOrder": 1
          },
          {
            "id": 3,
            "name": "list3",
            "displayOrder": 2
          }
        ]
      }
    ]`
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

describe("BacklogService for validate", function () {
  const client = new BacklogClientImpl(new FakeHttp, "testspace", "backlog.jp", "testapikeystring", new FakeDateFormatter)
  const taskIssue = {
    summary: "summary",
    description: "desc",
    startDate: "",
    dueDate: "",
    estimatedHours: "",
    actualHours: "",
    issueTypeName: "Task",
    categoryNames: "",
    versionNames: "",
    milestoneNames: "",
    priorityName: "",
    assigneeName: "",
    parentIssueKey: undefined,
    customFields: []
  }

  test("getIssueTypes", function () {
    const result = client.getIssueTypesV2(12345)
    expect(result.length).toBe(3)
  })

  test("getCustomFieldsV2", function () {
    const result = client.getCustomFieldsV2(12345)
    expect(result.length).toBe(1)
  })

  test("relatedIssueTypes.length should be 1", function () {
    const issues = [
      taskIssue
    ]
    const issueTypes = client.getIssueTypesV2(12345)
    const related = relatedIssueTypes(issues, issueTypes)
    expect(related.length).toBe(1)
  })

  test("relatedIssueTypes.length should be 2", function () {
    const issues = [
      taskIssue,
      Object.assign(
        {},
        taskIssue,
        {
          issueTypeName: "Bug"
        }
      )
    ]
    const issueTypes = client.getIssueTypesV2(12345)
    const related = relatedIssueTypes(issues, issueTypes)
    expect(related.length).toBe(2)
  })

  test("relatedCustomFieldDefinitions.length should be 1", function () {
    const issues = [
      Object.assign(
        {},
        taskIssue,
        {
          issueTypeName: "Request"
        }
      )
    ]
    const issueTypes = client.getIssueTypesV2(12345)
    const customFieldDefinitions = client.getCustomFieldsV2(12345)
    const relatedTypes = relatedIssueTypes(issues, issueTypes)
    const related = relatedCustomFieldDefinitions(relatedTypes, customFieldDefinitions)
    expect(related.length).toBe(1)
  })

  test("validate doesn't return error", function () {
    const issues = [
      taskIssue
    ]
    const issueTypes = client.getIssueTypesV2(12345)
    const customFieldDefinitions = client.getCustomFieldsV2(12345)
    const result = validate(issues, issueTypes, customFieldDefinitions, client, 'en')
    expect(result.isRight).toBe(true)
  })

  test("validate return error", function () {
    const issues = [
      Object.assign(
        {},
        taskIssue,
        {
          issueTypeName: "Request"
        }
      )
    ]
    const issueTypes = client.getIssueTypesV2(12345)
    const customFieldDefinitions = client.getCustomFieldsV2(12345)
    const result = validate(issues, issueTypes, customFieldDefinitions, client, 'en')
    expect(result.isLeft).toBe(true)
    result.recover(function(error) {
      expect(error.message).toBe(Message.VALIDATE_CUSTOM_FIELD_VALUE_IS_REQUIRED_UNSUPPORTED(customFieldDefinitions[0].name, "en"))
      return Left(error)
    })
  })

  test("validate return error", function () {
    const issues = [
      taskIssue
    ]
    const issueTypes = client.getIssueTypesV2(12345)
    const customFieldDefinitions = JSON.parse(
      `[
        {
          "id":339943,
          "version":1639647169000,
          "typeId":6,
          "name":"multilistfield",
          "description":"",
          "required":true,
          "useIssueType":false,
          "applicableIssueTypes":[],
          "displayOrder":2147483646,
          "allowAddItem":false,
          "items": [
            {
              "id": 1,
              "name": "list1",
              "displayOrder": 0
            },
            {
              "id": 2,
              "name": "list2",
              "displayOrder": 1
            },
            {
              "id": 3,
              "name": "list3",
              "displayOrder": 2
            }
          ]
        }
      ]`
    )
    const result = validate(issues, issueTypes, customFieldDefinitions, client, 'en')
    expect(result.isLeft).toBe(true)
    result.recover(function(error) {
      expect(error.message).toBe(Message.VALIDATE_CUSTOM_FIELD_VALUE_IS_REQUIRED_UNSUPPORTED(customFieldDefinitions[0].name, "en"))
      return Left(error)
    })
  })
})
