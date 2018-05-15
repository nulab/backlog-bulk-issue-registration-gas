type F1<A, B> = (a: A) => B
type F2<A, B, C> = (a: A, b: B) => C
type Lazy<A> = () => A

export type Left<E> = {
  isRight: false
  isLeft: true,
  error: E
}

export type Right<A> = {
  isLeft: false
  isRight: true,
  value: A
}

export const Right = <A>(value: A): Right<A> => ({
  isLeft: false,
  value,
  isRight: true
})

export const Left = <E>(error: E): Left<E> => ({
  isRight: false,
  error,
  isLeft: true
})

export type Either<E, A> = Left<E> | Right<A>

interface EitherOps {
  map<E, A, B>(either: Either<E, A>, f: F1<A, B>): Either<E, B>
  flatMap<E, A, B>(either: Either<E, A>, f: F1<A, Either<E, B>>): Either<E, B>
  recover<E, A, B>(either: Either<E, A>, f: F1<E, Either<E, A>>): Either<E, A>
  getOrElse<E, A>(either: Either<E, A>, value: Lazy<A>): A
  isRight<E, A>(either: Either<E, A>): either is Right<A>
  isLeft<E, A>(either: Either<E, A>): either is Left<E>
}

export const Either: EitherOps = {
  map: <E, A, B>(either: Either<E, A>, f: F1<A, B>): Either<E, B> =>
    Either.flatMap(either, (a) => Right(f(a))),

  flatMap: <E, A, B>(either: Either<E, A>, f: F1<A, Either<E, B>>): Either<E, B> =>
    Either.isRight(either) ? f(either.value) : either,

  recover: <E, A, B>(either: Either<E, A>, f: F1<E, Either<E, A>>): Either<E, A> =>
    Either.isLeft(either) ? f(either.error) : either,

  getOrElse: <E, A>(either: Either<E, A>, value: Lazy<A>): A =>
    Either.isRight(either) ? either.value : value(),

  isRight: <E, A>(either: Either<E, A>): either is Right<A> =>
    either.isRight,

  isLeft: <E, A>(either: Either<E, A>): either is Left<E> =>
    either.isLeft
}
