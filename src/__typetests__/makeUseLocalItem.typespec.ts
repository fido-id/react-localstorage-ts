import * as t from "io-ts"
import { makeUseLocalItem } from "../useLocalStorage"
import { DateFromISOString } from "io-ts-types"
import { fromIoTsCodec } from "../io-ts"

const ShapeCodec = t.type({ s: t.string, d: DateFromISOString })
type ShapeCodec = t.TypeOf<typeof ShapeCodec>

const CorrectCodec = fromIoTsCodec(ShapeCodec)

CorrectCodec.encode
const useShape = makeUseLocalItem("shape", CorrectCodec)

// @dts-jest:pass:snap It works with string encoding
makeUseLocalItem("sape", CorrectCodec)

// @dts-jest:fail:snap It doesn't work with non-string encoding
makeUseLocalItem("shape", ShapeCodec)

// @dts-jest:pass:snap You can pass a valid set of options
makeUseLocalItem("sape", CorrectCodec, {
  defaultValue: { s: "foo", d: new Date() },
  useMemorySore: false,
})

makeUseLocalItem("sape", CorrectCodec, {
  // @dts-jest:fail:snap You cannot pass an invalid set of options
  defaultValue: { foo: 123 },
  useMemorySore: false,
})

// @dts-jest:pass:snap resulting useShape typings are correct
useShape

// @dts-jest:fail:snap You cannot pass parameters to hooks
useShape("")
