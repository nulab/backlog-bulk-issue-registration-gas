import {F1, Lazy} from "./types"
import { Either, Right, Left } from "./Either";

export interface Option<A> {
  flatMap<B>(f: F1<A, Option<B>>): Option<B>
  map<B>(f: F1<A, B>): Option<B>
  getOrElse(defaultVal: Lazy<A>): A,
  isDefined: boolean,
  orError<E>(error: E): Either<E, A>
}

export const Some = <A>(value: A): Option<A> => {
  const self: Option<A> = {
    flatMap: <B>(f: F1<A, Option<B>>): Option<B> =>
      f(value),
    map: <B>(f: F1<A, B>): Option<B> =>
      Some(f(value)),
    getOrElse: (defaultVal: Lazy<A>): A =>
      value,
    isDefined: true,
    orError: <E>(_: E): Either<E, A> => Right(value)
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
    isDefined: false,
    orError: <E>(error: E): Either<E, A> => Left(error)
  }
  return self
}

export type Nullable<T> = T | undefined | null

export const Option = <A>(val: Nullable<A>): Option<A> => {
  if (val != null)
    return Some(val)
  return None()
}
