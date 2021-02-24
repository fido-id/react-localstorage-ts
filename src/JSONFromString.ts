import * as t from "io-ts"
import { iso, Newtype } from "newtype-ts"
import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import { pipe } from "fp-ts/function"

export type JSON = Newtype<{ readonly JSON: unique symbol }, unknown>
export const isoJSON = iso<JSON>()

export const JSONFromString = new t.Type<JSON, string>(
  "JSONFromString",
  (v): v is JSON => {
    const parsed = O.tryCatch(() => JSON.stringify(v))
    return O.isSome(parsed)
  },
  (u, context) => {
    return E.tryCatch(
      () => JSON.parse(u as any),
      () => [{ value: "JSON string", context }],
    )
  },
  (v) => {
    return pipe(v, isoJSON.unwrap, JSON.stringify)
  },
)
