![release](https://github.com/fido-id/react-localstorage-ts/actions/workflows/release.yml/badge.svg)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

# react-localstorage-ts

A small layer over the browser's localstorage, fallbacks to an in-memory store if localstorage is not supported by the browser.

Built with `fp-ts` in mind, `react-localstorage-ts` gives you a standard way to access objects stored locally.

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
import { makeHooksFromStorage, createLocalStorage } from "react-localstorage-ts"
import { ThemeFlavourCodec, AuthTokenCodec } from "./codecs"

export const localStorage = createLocalStorage(
  {
    themeFlavour: ThemeFlavourCodec,
    authToken: AuthTokenCodec,
  },
  { defaultValues: { themeFlavour: "light" } },
)

export const hooks = makeHooksFromStorage(storage)
```

then you use them in your react components:

```tsx
// App.tsx
import * as React from "react"
import * as LV from "react-localstorage-ts/LocalValue"
import LightThemeApp from "./components/LightThemeApp"
import DarkThemeApp from "./components/DarkThemeApp"
import { useThemeFlavour } from "./localHooks"

const App: React.FC = () => {
  const [themeFlavour, setThemeFlavour] = hooks.useThemeFlavour()

  return pipe(
    theme,
    LV.fold2(
      () => {
        console.error("wrong value stored in localStorage!")
      },
      (themeFlavour) => {
        switch (themeFlavour) {
          case "light": {
            return <LightThemeApp />
          }
          case "dark": {
            return <DarkThemeApp />
          }
        }
      },
    ),
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

It also has instances for some of the most common `fp-ts` type-classes, so that you can use it in the same way you usually use other `fp-ts` abstractions:

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
    LV.fold(
      () => "no token in storage",
      () => "malformed token in storage",
      () => <>{children}</>,
    ), // N.B. when you want to treat the "absent" and "incorrect" case in the same way, you can use fold2 and only define two handling funcitons
  )
}

// LoginPage.tsx
import * as LV from "react-localstorage-ts/LocalValue"
import { goToHomePage } from "./router"
import { useAccessToken } from "./localHooks"

const LoginPage: React.FC = ({ children }) => {
  const [token, setToken] = useAccessToken()

  React.useEffect(() => {
    if (LV.isValid(token)) {
      goToHomePage()
    }
  }, [])

  return (
    <Form
      onSubmit={(formValues) =>
        api.getToken(formValues).then((t) => setToken(t))
      }
    />
  )
}
```

## defining codecs

Given that browsers only allows you to store serialized data in string format, codecs must conform to the shape `Codec<E, string, B>`, where `E` is the type of the decoding error, `string` is the type of the data before decoding and `B` is the type of the runtime value.

If you use `io-ts` you can simply create a layer to convert `io-ts` codecs to `Codec` compliant instances:

```ts
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
```

If you want to update your localstorage from outside of a react component while still having your components "react" to the change,
you can use the utilities `getLocalValue`, `setLocalElement` and `removeLocalElement`.

## contributing

to commit to this repository there are a few rules:

- your commits must follow the conventional commit standard (it should be enforced by husky `commit-msg` hook).
- your code must be formatted using prettier.
- all tests must pass.

## release flow

[here](https://github.com/semantic-release/semantic-release/blob/1405b94296059c0c6878fb8b626e2c5da9317632/docs/recipes/pre-releases.md) you can find an explanation of the release flow.
