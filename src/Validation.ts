import {ValidationResult, Project, Key, isEmpty} from "./datas"
import {BacklogClient} from "./BacklogClient"
import {Either, Right, Left} from "./Either"

export interface Validation {
  parameters: (space: string, apiKey: string, projectKey: string) => Either<Error, boolean>
  apiAccess: (client: BacklogClient, projectKey: Key<Project>) => Either<Error, boolean>
}

export const Validation = (): Validation => ({
  parameters: (space: string, apiKey: string, projectKey: string): Either<Error, boolean> => {
    if (isEmpty(space))
      return Left(Error("スペースURLを入力してください"))
    if (isEmpty(apiKey))
      return Left(Error("API Keyを入力してください"))
    if (isEmpty(projectKey))
      return Left(Error("プロジェクトを入力してください"))
    return Right(true)
  },
  apiAccess: (backlogClient: BacklogClient, projectKey: Key<Project>): Either<Error, boolean> => {
    const maybeProject = backlogClient.getProjectV2(projectKey)
    if (maybeProject.isDefined)
      return Right(true)
    else
      return Left(Error("ログインに失敗しました."))
    // return maybeProject.map(function (project) {
    //   return Right(true)
    // }).getOrElse(Left(Error("ログインに失敗しました.")))
  }
})
