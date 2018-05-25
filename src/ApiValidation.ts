import {Project, Key} from "./datas"
import {BacklogClient} from "./BacklogClient"
import {Either, Right, Left} from "./Either"
import {Nullable} from "./Option"

export interface ApiValidation {
  parameters: (space: string, apiKey: string, projectKey: string) => Either<Error, any>
  apiAccess: (client: BacklogClient, projectKey: Key<Project>) => Either<Error, Project>
}

export type Validation<A> = (a: A, onError: Error) => Either<Error, A>

const notNull = <A>(): Validation<Nullable<A>> =>
  (a: Nullable<A>, onError: Error) => a != null ? Right(a) : Left(onError)

const isEmpty: Validation<string> = (str: string, onError: Error): Either<Error, string> =>
  str !== "" ? Right(str) : Left(onError)

export const ApiValidation = (): ApiValidation => ({
  parameters: (space: string, apiKey: string, projectKey: string): Either<Error, any> => {
    return isEmpty(space, Error("スペースURLを入力してください"))
      .flatMap(_ => isEmpty(apiKey, Error("APIキーを入力してください")))
      .flatMap(_ => isEmpty(projectKey, Error("プロジェクトキーを入力してください")))
  },
  apiAccess: (backlogClient: BacklogClient, projectKey: Key<Project>): Either<Error, Project> => {
    const result = backlogClient.getProjectV2(projectKey)
    return result.recover(error => {
      if (error.message.indexOf("returned code 404") !== -1)
        return Left(Error("スペースまたはプロジェクトが見つかりません"))
      if (error.message.indexOf("returned code 401") !== -1)
        return Left(Error("認証に失敗しました"))
      return Left(Error(`APIアクセスエラー ${error.message}`))
    })
  }
})
