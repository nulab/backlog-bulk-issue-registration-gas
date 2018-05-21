import {Either, Left, Right} from "./Either"
import {Option, Some, None} from "./Option"
import {Issue, Project, Id, IssueType, Category, WithName, Version, Priority, User, WithId} from "./datas"
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

export const IssueConverter = (
  issueTypes: List<IssueType>,
  categories: List<Category>,
  versions: List<Version>,
  priorities: List<Priority>,
  users: List<User>): IssueConverter => ({
  convert: (issue: any): Either<Error, Issue> => {
    const foundCategories = Either.sequence(
      lines(issue["categoryNames"]).map(
        item => findWithName(item, categories).orError(Error(`Cateogry not found. name: ${item}`))
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
    const foundPriority = findWithId(+issue["priorityId"], priorities)
      .orError(Error(`Priority not found. id: ${issue["priorityId"]}`))
    const foundOptUser = Either.sequenceOption(
      Option(issue["assigneeName"])
        .map(
          item => findWithName(item, users).orError(new Error(`Assignee not found. name: ${item}`))
        )
    )

    return Either.map6(
      foundCategories, foundVersions, foundMilestones, foundIssueType, foundPriority, foundOptUser,
      (categories, versions, milestones, issueType, priority, optUser) => {
        return Right(
          Issue(
            issue["id"], // always `undefined`
            issue["projectId"],
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
            Option(issue["parentIssueId"])
          )
        )
    })
  }
})
