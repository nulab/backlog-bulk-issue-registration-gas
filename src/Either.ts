import {F1, Lazy, F3, F4, F5, F6, F7, F2} from "./types"
import {Option, Some, None} from "./Option"
import {BacklogResult} from "./datas"
import {List} from "./List"

export interface Either<E, A> {
  map<B>(f: F1<A, B>): Either<E, B>
  flatMap<B>(f: F1<A, Either<E, B>>): Either<E, B>
  recover<B>(f: F1<E, Either<E, A>>): Either<E, A>
  getOrElse(value: Lazy<A>): A,
  forEach(f: F1<A, void>): void,
  isLeft: boolean
  isRight: boolean
  right(): Option<A>,
  left: () => Option<E>,
  toBacklogResult: () => BacklogResult,
  getOrError()
}

export const Right = <E, A>(value: A): Either<E, A> => {
  const self: Either<E, A> = {
    flatMap: <B>(f: F1<A, Either<E, B>>): Either<E, B> => f(value),
    map: <B>(f: F1<A, B>): Either<E, B> => self.flatMap((x) => Right(f(x))),
    recover: <B>(f: F1<E, Either<E, A>>): Either<E, A> => self,
    getOrElse: (defaultVal: Lazy<A>): A => value,
    forEach: (f: F1<A, void>): void => f(value),
    isLeft: false,
    isRight: true,
    right: () => Some(value),
    left: () => None(),
    toBacklogResult: (): BacklogResult => BacklogResult(true, "", value),
    getOrError: (): A => value
  }
  return self
}

export const Left = <E, A>(value: E): Either<E, A> => {
  const self: Either<E, A> = {
    flatMap: <B>(f: F1<A, Either<E, B>>): Either<E, B> => self as any as Either<E, B>,
    map: <B>(f: F1<A, B>): Either<E, B> => self as any as Either<E, B>,
    recover: <B>(f: F1<E, Either<E, A>>): Either<E, A> => f(value),
    getOrElse: (defaultVal: Lazy<A>): A => defaultVal(),
    forEach: (f: F1<A, void>): void => {},
    isLeft: true,
    isRight: false,
    right: () => None(),
    left: () => Some(value),
    toBacklogResult: (): BacklogResult => {
      if (value instanceof Error)
        return BacklogResult(false, value.message, undefined)
      return BacklogResult(false, value.toString(), undefined)
    },
    getOrError: (): A => { throw value }
  }
  return self
}

export const Either = {
  sequence: <E, A>(eithers: List<Either<E, A>>): Either<E, List<A>> => {
    let i = 0
    const length = eithers.length
    let items = []

    while (i < length) {
      const item = eithers[i]
      if (item.isLeft)
        return item as any as Either<E, List<A>>
      item.forEach(v => items = [...items, v])
      i++
    }
    return Right(items)
  },
  map4: <E, A, B, C, D, F>(a: Either<E, A>, b: Either<E, B>, c: Either<E, C>, d: Either<E, D>,
                           f: F4<A, B, C, D, Either<E, F>>): Either<E, F> =>
    Either.map3(a, b, c, (va, vb, vc) => {
      return d.flatMap(vd => f(va, vb, vc, vd))
    }),
  map5: <E, A, B, C, D, F, G>(a: Either<E, A>, b: Either<E, B>, c: Either<E, C>, d: Either<E, D>, f: Either<E, F>,
                              g: F5<A, B, C, D, F, Either<E, G>>): Either<E, G> =>
      Either.map4(a, b, c, d, (va, vb, vc, vd) => {
        return f.flatMap(vf => g(va, vb, vc, vd, vf))
      }),
  map2: <E, A, B, C>(a: Either<E, A>, b: Either<E, B>,
                     f: F2<A, B, Either<E, C>>) =>
    a.flatMap(va => {
      return b.flatMap(vb => {
        return f(va, vb)
      })
    }),
  map3: <E, A, B, C, D>(a: Either<E, A>, b: Either<E, B>, c: Either<E, C>,
                        f: F3<A, B, C, Either<E, D>>): Either<E, D> =>
    Either.map2(a, b, (va, vb) => {
      return c.flatMap(vc => f(va, vb, vc))
    }),
  map6: <E, A, B, C, D, F, G, H>(a: Either<E, A>, b: Either<E, B>, c: Either<E, C>,
                                 d: Either<E, D>, f: Either<E, F>, g: Either<E, G>,
                                 h: F6<A, B, C, D, F, G, Either<E, H>>): Either<E, H> =>
    Either.map5(a, b, c, d, f, (va, vb, vc, vd, vf) => {
      return g.flatMap(vg => h(va, vb, vc, vd, vf, vg))
    }),
  map7: <E, A, B, C, D, F, G, H, J>(a: Either<E, A>, b: Either<E, B>, c: Either<E, C>,
                                    d: Either<E, D>, f: Either<E, F>, g: Either<E, G>,
                                    h: Either<E, H>, j: F7<A, B, C, D, F, G, H, Either<E, J>>): Either<E, J> =>
    Either.map6(a, b, c, d, f, g, (va, vb, vc, vd, vf, vg) => {
      return h.flatMap(vh => j(va, vb, vc, vd, vf, vg, vh))
    }),

  sequenceOption: <E, A>(opt: Option<Either<E, A>>): Either<E, Option<A>> => {
    return opt.map(item => {
      return item.map(value => Some(value))
    }).getOrElse(() => Right(None()))
  }
}
