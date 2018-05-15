export type F1<A, B> = (a: A) => B
export type F2<A, B, C> = (a: A, b: B) => C
export type Lazy<A> = () => A
export type List<A> = ReadonlyArray<A>
