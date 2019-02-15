import {Either, Left, Right} from "./Either"
import {Option, Some, None} from "./Option"
import {Issue, Project, Id, IssueType, Category, WithName, Version, Priority, User, WithId, CustomFieldDefinition, CustomField} from "./datas"
import {Predicate, List, find} from "./List"

export interface IssueConverter {
  convert(issue: any): Either<Error, Issue>
}

const isEmpty = (str: string): boolean =>
  str === "" ? true : false

// "itemA\n\nitemB" => ["itemA", "itemB"]
const lines = (str: string): string[] =>
  str.split("\n").filter(item => !isEmpty(item)).map(s => s.trim())

const withId = (id: number): Predicate<WithId> =>
  (item: WithId) => item.id === id

const withName = (name: string): Predicate<WithName> =>
  (item: WithName) => item.name === name

const findWithId = <A extends WithId>(id: number, items: List<A>): Option<A> =>
  find<A>(withId(id), items)

const findWithName = <A extends WithName>(name: string, items: List<A>): Option<A> =>
  find<A>(withName(name), items)

export const extractFromString = (str: string): Option<number> => {
  const match = str.match(/.*?attribute.id=(\d+?)"/)
  const result = Option(match)
  return result.map(results => +results[1])
}

export const IssueConverter = (
  projectId: Id<Project>,
  issueTypes: List<IssueType>,
  categories: List<Category>,
  versions: List<Version>,
  priorities: List<Priority>,
  users: List<User>,
  customFieldDefinitions: List<CustomFieldDefinition>): IssueConverter => ({
  convert: (issue: any): Either<Error, Issue> => {
    const foundCategories = Either.sequence(
      lines(issue["categoryNames"]).map(
        item => findWithName(item, categories).orError(Error(`Category not found. name: ${item}`))
    ))
    const foundVersions = Either.sequence(
      lines(issue["versionNames"]).map(
        item => findWithName(item, versions).orError(Error(`Version not found. name: ${item}`))
    ))
    const foundMilestones = Either.sequence(
      lines(issue["milestoneNames"]).map(
        item => findWithName(item, versions).orError(Error(`Milestone not found. name: ${item}`))
    ))
    const foundIssueType = findWithName(issue["issueTypeName"], issueTypes)
      .orError(Error(`IssueType not found. name: ${issue["issueTypeName"]}`))
    const foundPriority = Option<string>(issue["priorityName"])
      .map(name => findWithName(name, priorities)
        .orError(Error(`Priority not found. name: ${issue["priorityName"]}`)))
      .getOrElse(() => Right(Priority(3, "default")))
    const foundOptUser = Either.sequenceOption(
      Option(issue["assigneeName"])
        .map(item => findWithName(item, users).orError(new Error(`Assignee not found. name: ${item}`)))
    )
    const foundCustomFields = Either.sequence(
      (issue["customFields"] as List<any>).map(function(item) {
        return extractFromString(item.header)
          .orError(Error("Invalid custom field header. Raw input: " + item))
          .flatMap(customFieldId =>
            findWithId(customFieldId, customFieldDefinitions)
              .orError(Error(`Custom field definition not found. id: ${customFieldId}`))
              .flatMap(definition =>
                Either.sequenceOption(
                  definition.items.map(items => findWithName(item.value, items).orError(new Error(`Custom field item not found. value: ${item.value}`)))
                )
                .map(optItem => optItem.map(item => item.id.toString()))
                .map(optId => optId.getOrElse(() => item.value.toString()))
                .map(value => CustomField(customFieldId, definition.typeId, value))
              )
          )
      })
    )

    return Either.map7(
      foundCategories, foundVersions, foundMilestones, foundIssueType, foundPriority, foundOptUser, foundCustomFields,
      (categories, versions, milestones, issueType, priority, optUser, customFields) => {
        return Right(
          Issue(
            undefined,
            "",
            projectId,
            issue["summary"],
            Option(issue["description"]),
            Option(issue["startDate"]).map(item => new Date(item)),
            Option(issue["dueDate"]).map(item => new Date(item)),
            Option(issue["estimatedHours"]).map(item => +item),
            Option(issue["actualHours"]).map(item => +item),
            issueType,
            categories,
            versions,
            milestones,
            priority,
            optUser,
            Option(issue["parentIssueKey"]),
            customFields
          )
        )
    })
  }
})
