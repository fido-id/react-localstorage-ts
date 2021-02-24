import * as t from "io-ts"
import { makeDefaultedUseLocalItem } from "../useLocalStorage"
import { DateFromISOString } from "io-ts-types"
import { pipe } from "fp-ts/lib/function"
import * as E from "fp-ts/Either"
import { isoJSON, JSONFromString } from "../JSONFromString"

declare module "../useLocalStorage" {
  interface StoredItems {
    readonly shape: { s: string; d: Date }
  }
}

const ShapeCodec = t.type({ s: t.string, d: DateFromISOString })
type ShapeCodec = t.TypeOf<typeof ShapeCodec>

const defaultShape: ShapeCodec = { s: "foo", d: new Date(1600732800 * 1000) }

export const ShapeCodecFromString = new t.Type<ShapeCodec, string>(
  "ShapeCodecFromString",
  ShapeCodec.is,
  (u, c) => {
    return pipe(
      JSONFromString.validate(u, c),
      E.chain((json) => ShapeCodec.validate(json, c)),
    )
  },
  (v) => {
    return pipe(v, ShapeCodec.encode, isoJSON.wrap, JSONFromString.encode)
  },
)

const useShape = makeDefaultedUseLocalItem(
  "shape",
  ShapeCodecFromString,
  () => defaultShape,
)

// @dts-jest:fail:snap You must give a default
makeDefaultedUseLocalItem("shape", ShapeCodecFromString)

// @dts-jest:fail:snap You cannot use non existing stored keys
makeDefaultedUseLocalItem("sape", ShapeCodecFromString, () => defaultShape)

// @dts-jest:fail:snap You cannot use uncorrect codecs
makeDefaultedUseLocalItem("shape", ShapeCodec, () => defaultShape)

// @dts-jest:pass:snap resulting useShape typings are correct
useShape

// @dts-jest:fail:snap You cannot pass parameters to hooks
useShape("")
