import { Either } from "./Either"

export interface Codec<A, B, E> {
  encode: (b: B) => A
  decode: (b: unknown) => Either<E, B>
}

export type decodeType<C> = C extends Codec<any, infer B, infer E>
  ? Either<E, B>
  : never
export type runtimeType<C> = C extends Codec<any, infer B, any> ? B : never
