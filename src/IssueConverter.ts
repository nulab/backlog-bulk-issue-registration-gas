import {Either, Left, Right} from "./Either"
import {Option, Some, None} from "./Option"
import {Issue, Project, Id, IssueType, Category, WithName, Version, Priority, User} from "./datas"
import {Predicate, List, find} from "./List"

export interface IssueConverter {
  convert(issue: JSON): Either<Error, Issue>
}

// "itemA\n\nitemB" => ["itemA", "itemB"]
const lines = (str: string): string[] =>
  str.split("\n").filter(item => item !== "")


const withName = (name: string): Predicate<WithName> =>
    (item: WithName) => item.name === name

const findWithName = <A extends WithName>(name: string, items: ReadonlyArray<A>): Option<A> =>
    find<A>(withName(name), items)

export const IssueConverter = (
  issueTypes: IssueType[],
  categories: Category[],
  versions: Version[],
  priorities: Priority[],
  users: User[]): IssueConverter => ({
  convert: (issue: JSON): Either<Error, Issue> => {
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
    const foundPriority = findWithName(issue["priorityName"], priorities)
        .orError(Error(`Priority not found. name: ${issue["priorityName"]}`))
    const foundOptUser = Either.sequenceOption(
        Option(issue["assigneeName"])
            .map(
            item => findWithName(item, users).orError(new Error(`Assignee not found. name: ${item}`)
        ))
    )

    return Either.map6(
        foundCategories, foundVersions, foundMilestones, foundIssueType, foundPriority, foundOptUser,
        (categories, versions, milestones, issueType, priority, optUser) => {
            return Right(
                Issue(
                    issue["id"], // TODO
                    issue["projectId"],
                    issue["summary"],
                    Option(issue["description"]),
                    Option(issue["startDate"]),
                    Option(issue["dueDate"]),
                    Option(issue["estimatedHours"]),
                    Option(issue["actualHours"]),
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
