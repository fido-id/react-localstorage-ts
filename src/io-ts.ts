import { pipe } from "fp-ts/lib/function"
import * as t from "io-ts"
import * as E from "fp-ts/Either"
import { Json, JsonFromString } from "io-ts-types"
import * as LV from "./LocalValue"
import { Codec } from "./Codec"

const adaptIoTsCodec = <A, B>(C: t.Type<B, A>): Codec<t.Errors, A, B> => {
  return {
    encode: C.encode,
    decode: (u: unknown) => LV.fromEither(C.decode(u)),
  }
}

export const fromIoTsCodec = <A, B extends Json>(C: t.Type<A, B>) => {
  const stringCodec = new t.Type<A, string>(
    C.name,
    C.is,
    (u, c) => {
      return pipe(
        t.string.validate(u, c),
        E.chain((jsonString) => JsonFromString.validate(jsonString, c)),
        E.chain((json) => C.validate(json, c)),
      )
    },
    (v) => {
      return pipe(v, C.encode, JsonFromString.encode)
    },
  )

  return adaptIoTsCodec(stringCodec)
}
