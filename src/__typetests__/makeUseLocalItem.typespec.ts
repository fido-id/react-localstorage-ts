import * as t from "io-ts"
import { makeUseLocalItem } from "../useLocalStorage"
import { DateFromISOString, JsonFromString } from "io-ts-types"
import { pipe } from "fp-ts/lib/function"
import * as E from "fp-ts/Either"

const ShapeCodec = t.type({ s: t.string, d: DateFromISOString })
type ShapeCodec = t.TypeOf<typeof ShapeCodec>

export const ShapeCodecFromString = new t.Type<ShapeCodec, string>(
  "ShapeCodecFromString",
  ShapeCodec.is,
  (u, c) => {
    return pipe(
      t.string.validate(u, c),
      E.chain((jsonString) => JsonFromString.validate(jsonString, c)),
      E.chain((json) => ShapeCodec.validate(json, c)),
    )
  },
  (v) => {
    return pipe(v, ShapeCodec.encode, JsonFromString.encode)
  },
)

const useShape = makeUseLocalItem("shape", ShapeCodecFromString)

// @dts-jest:pass:snap It works with string encoding
makeUseLocalItem("sape", ShapeCodecFromString)

// @dts-jest:fail:snap It doesn't work with non-string encoding
makeUseLocalItem("shape", ShapeCodec)

// @dts-jest:pass:snap You can pass a valid set of options
makeUseLocalItem("sape", ShapeCodecFromString, {
  defaultValue: { s: "foo", d: new Date() },
  useMemorySore: false,
})

makeUseLocalItem("sape", ShapeCodecFromString, {
  // @dts-jest:fail:snap You cannot pass an invalid set of options
  defaultValue: { foo: 123 },
  useMemorySore: false,
})

// @dts-jest:pass:snap resulting useShape typings are correct
useShape

// @dts-jest:fail:snap You cannot pass parameters to hooks
useShape("")
