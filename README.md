![release](https://github.com/ModataSRL/react-localstorage-ts/actions/workflows/release.yml/badge.svg)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

# react-localstorage-ts

A small layer over the browser's localstorage, fallbacks to an in-memory store if localstorage is not supported by the browser.

Built on with `fp-ts` in mind, `react-localstorage-ts` gives you a standard way to access objects stored locally.

## install

### yarn
```shell
yarn add react-localstorage-ts
```
### npm
```shell
npm install -S react-localstorage-ts
```

## quick start
First create the hooks to read/write the values you just defined:

```tsx
// localHooks.ts
import * as t from "io-ts"
import {
  makeUseLocalItem,
} from "react-localstorage-ts"
import {ThemeFlavour} from "./codecs"

export const useThemeFlavour = makeUseLocalItem(
  "theme",
  ThemeFlavour,
  { defaultValue: "light" },
)
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
A new data structure is defined for items stored in localstorage, `LocalValue`. When dealing with a value stored in your localstorage there are three possibilities:
1. there is no value in your localstorage (optionality).
2. the value is present, but it is wrong (correctness).
3. the value is present and it is valid (also correctness).

LocalValue introduces a sum type that represents the optionality/correctness dicotomy:

```ts
export interface Absent {
  readonly _tag: "Absent"
}

export interface Invalid<E> {
  readonly _tag: "Invalid"
  readonly errors: E
}
export interface Valid<A> {
  readonly _tag: "Valid"
  readonly value: A
}

export type LocalValue<E, A> = Absent | Invalid<E> | Valid<A>
```
It also has instances for some of the most common type-classes
and you can use it in the same way you usually use your usual `fp-ts` abstractions:

```tsx
// LoginLayout.tsx
import * as LV from "react-localstorage-ts/LocalValue"
import { useAccessToken } from "./localHooks"
import { goToLoginPage } from "./router"
import App from "./App"

const LoginLayout: React.FC = ({ children }) => {
  const [token] = useAccessToken()

  React.useEffect(() => {
    if (!LV.isValid) {
      goToLoginPage()
    }
  }, [])

  return pipe(
    token,
    LV.fold(() => null, () => null, () => <>{ children }</>), // N.B. when you don't want to deal with the "incorrect" cases, you can use fold2 and only define two handling funcitons
  )
}

// LoginPage.tsx
import * as LV from "react-localstorage-ts/LocalValue"
import { goToHomePage } from "./router"
import { useAccessToken } from "./localHooks"

const LoginPage: React.FC = ({ children }) => {
  const [token, setToken] = useAccessToken()

  React.useEffect(() => {
    if (LV.isValid) {
      goToHomePage()
    }
  }, [])

  return (
    <Form
      onSubmit={
        (formValues) => api
          .getToken(formValues)
          .then(t => setToken(t))
      }
    />
  )
}
```

## defining codecs
Given that browsers only allow you to store serialized data in string format, the only accepted codecs are of the form `Codec<E, string, B>`, where `E` is the shape of the decoding error, `B` is the shape of the runtime error and `string` is the type resulting after encoding.


---
> N.B. this is only useful if you use `io-ts`.

As this kind of string conversion is very often just a JSON stringification of your encoded value, we export a utility that conveniently transform `io-ts` codecs into valid ones by first applying your encoding and then stringifying the result:

```ts
import { fromIoTsCodec } from "react-localstorage-ts/io-ts"

const WrongCodec = t.type({ s: t.string, d: DateFromISOString })

const CorrectCodec = fromIoTsCodec(WrongCodec)
```

## updating localstorage from outside react components

If you want to update your localstorage (and having your components "react" to the change) you can use the exported utilities `getLocalElement`, `setLocalElement` and `removeLocalElement`.

## contributing
to commit to this repository there are a few rules:
- your commits must follow the conventional commit standard (it should be enforced by husky `commit-msg` hook).
- your code must be formatted using prettier.
- all tests must pass.

## release flow
[here](https://github.com/semantic-release/semantic-release/blob/1405b94296059c0c6878fb8b626e2c5da9317632/docs/recipes/pre-releases.md) you can find an explanation of the release flow.
