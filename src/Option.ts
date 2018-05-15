import {F1, Lazy} from "./types"

export interface Option<A> {
  flatMap<B>(f: F1<A, Option<B>>): Option<B>
  map<B>(f: F1<A, B>): Option<B>
  getOrElse(defaultVal: Lazy<A>): A,
  isDefined: boolean
}

export const Some = <A>(value: A): Option<A> => {
  const self: Option<A> = {
    flatMap: <B>(f: F1<A, Option<B>>): Option<B> =>
      f(value),
    map: <B>(f: F1<A, B>): Option<B> =>
      Some(f(value)),
    getOrElse: (defaultVal: Lazy<A>): A =>
      value,
    isDefined: true
  }
  return self
}

export const None = <A>(): Option<A> => {
  const self: Option<A> = {
    flatMap: <B>(f: F1<A, Option<B>>): Option<B> =>
      None(),
    map: <B>(f: F1<A, B>): Option<B> =>
      None(),
    getOrElse: (defaultVal: Lazy<A>): A =>
      defaultVal(),
    isDefined: false
  }
  return self
}

export type Nullable<T> = T | undefined | null

export const Option = <A>(val: Nullable<A>): Option<A> => {
  if (val != null)
    return Some(val)
  return None()
}
