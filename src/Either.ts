import {F1, Lazy} from "./types"
import {Option, Some, None} from "./Option"
import {ValidationResult} from "./datas"

export interface Either<E, A> {
  map<B>(f: F1<A, B>): Either<E, B>
  flatMap<B>(f: F1<A, Either<E, B>>): Either<E, B>
  recover<B>(f: F1<E, Either<E, A>>): Either<E, A>
  getOrElse(value: Lazy<A>): A
  isLeft: boolean
  isRight: boolean
  right(): Option<A>,
  left: () => Option<E>,
  toValidationResult: () => ValidationResult
}

export const Right = <E, A>(value: A): Either<E, A> => {
  const self: Either<E, A> = {
    flatMap: <B>(f: F1<A, Either<E, B>>): Either<E, B> => f(value),
    map: <B>(f: F1<A, B>): Either<E, B> => self.flatMap((x) => Right(f(x))),
    recover: <B>(f: F1<E, Either<E, A>>): Either<E, A> => self,
    getOrElse: (defaultVal: Lazy<A>): A => value,
    isLeft: false,
    isRight: true,
    right: () => Some(value),
    left: () => None(),
    toValidationResult: (): ValidationResult => ValidationResult(true, "")
  }
  return self
}

export const Left = <E, A>(value: E): Either<E, A> => {
  const self: Either<E, A> = {
    flatMap: <B>(f: F1<A, Either<E, B>>): Either<E, B> => self as any as Either<E, B>,
    map: <B>(f: F1<A, B>): Either<E, B> => self as any as Either<E, B>,
    recover: <B>(f: F1<E, Either<E, A>>): Either<E, A> => f(value),
    getOrElse: (defaultVal: Lazy<A>): A => defaultVal(),
    isLeft: true,
    isRight: false,
    right: () => None(),
    left: () => Some(value),
    toValidationResult: (): ValidationResult => {
      if (value instanceof Error)
        return ValidationResult(false, value.message)
      return ValidationResult(false, value.toString())
    }
  }
  return self
}
