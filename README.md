![release](https://github.com/ModataSRL/react-localstorage-ts/actions/workflows/release.yml/badge.svg)

#react-localstorage-ts

A small library to wrap the browser's `localstorage`.

`react-localstorage-ts` is a small layer over the browser's localstorage and fallbacks to an in-memory store is the browser does not support it.  

Build on `io-ts` and `fp-ts`, this lib gives you a standard way to access objects stored in your localStorage using `io-ts`'s encoding/decoding abilities.

##quick start
To use `react-localstorage-ts` you have to follow a few simple steps:

First you need to define the list of "storable" items by expanding the `StoredItems` interface:

```ts
// store.ts
import * as t from "io-ts"
export const ThemeFlavour = t.union([t.literal("light"), t.literal("dark")])
export type ThemeFlavour = t.TypeOf<typeof ThemeFlavour>

declare module "react-localstorage-ts" {
    interface StoredItems {
        access_token: string
        theme: ThemeFlavour
    }
}
```

then you create the hooks to read/write the values you just defined:

```tsx
// localHooks.ts
import * as t from "io-ts"
import {
  makeDefaultedUseLocalItem,
  makeUseLocalItem,
} from "react-localstorage-ts"
import {ThemeFlavour} from "./store"

export const useThemeFlavour = makeDefaultedUseLocalItem("theme", ThemeFlavour, () => "light")
export const useAccessToken = makeUseLocalItem("access_token", t.string)
```

then you use them in your react components:
```tsx
// App.tsx
import * as React from "react"
import * as E from "fp-ts/Either"
import LightThemeApp from "./components/LightThemeApp"
import DarkThemeApp from "./components/DarkThemeApp"
import { useThemeFlavour } from "./localHooks"

const App: React.FC = () => {
  const [theme, setTheme] = useThemeFlavour()
  
  return pipe(
    theme,
    E.fold(
      () => {
        console.error('wrong value stored in localStorage!')
      },
      themeFlavour => {
        switch (themeFlavour) {
          case "light": {
            return <LightThemeApp />
          }
          case "dark": {
            return <DarkThemeApp />
          }
        }
      }
    )
  )
}

export default App
```
## LocalValue
A new data structure is defined for items stored in localstorage, `LocalValue`. It has instances for some of the most used type-classes
and you can use it in the same way you usually use your usual `fp-ts` abstractions:

```ts
import * as LV from "react-localstorage-ts/LocalValue"
import { useThemeFlavour } from "./localHooks"
import App from "./App"

const AppContainer: React.FC = () => {
  const [theme] = useThemeFlavour()

  const t = pipe(
    theme,
    LV.getOrElse(() => "light"),
  )

  return <App theme={t} />
}
```

## defining codecs 
creating a custom codec to use with `makeUseLocalItem` can be a really non-trivial task, that's why 
we ship the utility codec `JSONFromString` that can be used to "ease the pain". Here is an example of how you can use it to define a custom codec:

```ts
import * as t from "io-ts"
import * as E from "fp-ts/Either"
import { pipe } from "fp-ts/function"
import { JSONFromString, isoJSON } from "react-localstorage-ts/JSONFromString"

const ShapeCodec = t.type({ s: t.string, d: DateFromISOString })
type ShapeCodec = t.TypeOf<typeof ShapeCodec>

const defaultShape: ShapeCodec = {
  s: "foo",
  d: new Date(),
}

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
```

##contributing
to commit to this repository there are a few rules:
- your commits must follow the conventional commit standard (it should be enforced by husky commit-msg hook).
- your code must be formatted using prettier. 
- all tests must pass.

##release flow
[here](https://github.com/semantic-release/semantic-release/blob/1405b94296059c0c6878fb8b626e2c5da9317632/docs/recipes/pre-releases.md) you can find an explanation of the release flow.