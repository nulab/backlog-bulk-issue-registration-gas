
import {Some, None, Option} from "./Option"
import {F1} from "./types"

export type List<A> = ReadonlyArray<A>
export type Predicate<A> = F1<A, boolean>

export const find = <A>(predicate: Predicate<A>, list: List<A>): Option<A> => {
  let i = 0
  const length = list.length
  let found = null

  while (i < length) {
    if (predicate(list[i]))
      return Some(list[i])
    i++
  }
  return None()
}
