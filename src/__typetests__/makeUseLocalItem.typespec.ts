import * as t from "io-ts"
import { makeStorageHooks, makeUseLocalItem } from "../useLocalStorage"
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

const hooks = makeStorageHooks({
  // @dts-jest:pass:snap It works with string encoding
  foo: CorrectCodec
})

const defaultShape = { s: "foo", d: new Date() }

makeStorageHooks({
  // @dts-jest:fail:snap It doesn't work with non-string encoding
  foo: ShapeCodec,
})

const hooksWithOptions = makeStorageHooks(
  {
    foo: CorrectCodec,
  },
  // @dts-jest:pass:snap You can pass a valid set of options to store
  { useMemorySore: true, defaultValues: { foo: defaultShape } },
)

makeStorageHooks(
  {
    foo: CorrectCodec,
  },
  // @dts-jest:fail:snap You cannot pass an invalid set of options to store
  { useMemorySore: true, defaultValues: { fo: defaultShape } },
)

// @dts-jest:pass:snap store returns the correct type encoding
hooks

// @dts-jest:pass:snap storeWithOptions returns the correct type encoding
hooksWithOptions
