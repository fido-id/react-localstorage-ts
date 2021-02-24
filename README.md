![release](https://github.com/ModataSRL/react-localstorage-ts/actions/workflows/release.yml/badge.svg)

#react-localstorage-ts

A small library to wrap browser's localstorage in a functional fashion.

`react-localstorage-ts` act as a small layer over the browser's localstorage and fallbacks to an in-memory store is the browser does not support it.  
Build over `io-ts` and `fp-ts`, `react-localstorage-ts` gives you a standard way to access objects stored in your localStorage using `io-ts`'s encoding/decoding abilities.

first you have to define the list of "storable" items by expanding the `StoredItems` interface:

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

then you create the hooks fot the defined values:

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

then you can freely use them in your react components:
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

##contributing
to commit to this repository there are a few rules:
- your commits must follow the conventional commit standard (it should be enforced by husky commit-msg hook).
- your code must be formatted using prettier. 
- all tests must pass.

[here](https://github.com/semantic-release/semantic-release/blob/1405b94296059c0c6878fb8b626e2c5da9317632/docs/recipes/pre-releases.md) is the release flow explained