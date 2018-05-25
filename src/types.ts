export type F1<A, B> = (a: A) => B
export type F2<A, B, C> = (a: A, b: B) => C
export type F3<A, B, C, D> = (a: A, b: B, c: C) => D
export type F4<A, B, C, D, E> = (a: A, b: B, c: C, d: D) => E
export type F5<A, B, C, D, E, F> = (a: A, b: B, c: C, d: D, e: E) => F
export type F6<A, B, C, D, E, F, G> = (a: A, b: B, c: C, d: D, e: E, f: F) => G
export type F7<A, B, C, D, E, F, G, H> = (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => H
export type Lazy<A> = () => A
