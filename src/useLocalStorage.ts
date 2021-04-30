import * as React from "react"
import * as R from "fp-ts/Record"
import * as O from "fp-ts/Option"
import { pipe } from "fp-ts/function"
import { Codec, decodeType, runtimeType } from "./Codec"
import {
  getLocalValue,
  setLocalValue,
  removeLocalValue,
  LocalStorageOptions,
  StorageDef,
  RuntimeValues,
  StorageInstance,
  LocalValueModifiers,
} from "localvalue-ts"
import {
  LocalStorageChangedEvent,
  storeChangedCustomEvent,
} from "localvalue-ts/localStorageProxy"
import * as LV from "./LocalValue"

// -------------------------------------------------------------------------------------
// fp-ts data structures
// -------------------------------------------------------------------------------------

interface IO<A> {
  (): A
}

// -------------------------------------------------------------------------------------
// reactLocalStorage
// -------------------------------------------------------------------------------------

type ValidCodec = Codec<any, string, any>

export type ValidLocalValue<A> = LV.Absent | LV.Valid<A>

interface UseLocalItemOptions<C extends ValidCodec> {
  useMemorySore?: boolean
  defaultValue?: runtimeType<C>
}

export type LocalValueHook<C extends ValidCodec> = () => [
  item: decodeType<C>,
  setItem: (i: ValidLocalValue<runtimeType<C>>) => IO<void>,
]

const isLocalStorageEvent = (e: any): e is LocalStorageChangedEvent => {
  return typeof e?.detail?.key === "string"
}

export const makeUseLocalItem = <C extends ValidCodec>(
  key: string,
  codec: C,
  options?: UseLocalItemOptions<C>,
): LocalValueHook<C> => () => {
  const [item, setItem] = React.useState(
    getLocalValue(key, codec, options)() as decodeType<C>,
  )

  const setItemMemo = React.useMemo(() => {
    return (i: ValidLocalValue<runtimeType<C>>) => () =>
      pipe(
        i,
        LV.fold2(
          () => {
            removeLocalValue(key, options)()
            setItem(getLocalValue(key, codec, options)() as decodeType<C>)
          },
          (newValue) => {
            setLocalValue(key, codec, newValue, options)()
            setItem(getLocalValue(key, codec, options)() as decodeType<C>)
          },
        ),
      )
  }, [item])

  const onLocalStorageChange = (
    event: StorageEvent | LocalStorageChangedEvent,
  ) => {
    if (isLocalStorageEvent(event)) {
      if (event.detail.key === key) {
        setItem(getLocalValue(key, codec, options)() as decodeType<C>)
      }
    } else {
      if (event.key === key) {
        setItem(getLocalValue(key, codec, options)() as decodeType<C>)
      }
    }
  }

  React.useEffect(() => {
    const listener = (e: Event) => {
      onLocalStorageChange(e as StorageEvent)
    }

    window.addEventListener(storeChangedCustomEvent, listener)
    // The storage event only works in the context of other documents (eg. other browser tabs)
    window.addEventListener("storage", listener)

    return () => {
      window.removeEventListener(storeChangedCustomEvent, listener)
      window.removeEventListener("storage", listener)
    }
  }, [key])

  return [item, setItemMemo]
}

type StorageHooks<S> = S extends StorageDef<infer K>
  ? {
      [k in K as `use${Capitalize<k>}`]: LocalValueHook<S[k]>
    }
  : never

const storageOptionsToValueOptions = <
  K extends string,
  SO extends LocalStorageOptions<Partial<Record<K, any>>> | undefined
>(
  k: K,
  so: SO,
): UseLocalItemOptions<any> => ({
  useMemorySore: so?.useMemorySore,
  defaultValue:
    so?.defaultValues === undefined
      ? undefined
      : pipe(
          R.lookup(k, so.defaultValues as Record<K, any>),
          O.getOrElse(() => undefined),
        ),
})

const capitalize = (s: string) => {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const makeStorageHooks = <S extends StorageDef<any>>(
  storage: S,
  o?: LocalStorageOptions<Partial<RuntimeValues<S>>>,
): StorageHooks<S> => {
  return pipe(
    storage,
    R.reduceWithIndex({}, (k, acc, c) => ({
      ...acc,
      [`use${capitalize(k)}`]: makeUseLocalItem(
        k,
        c,
        storageOptionsToValueOptions(k, o),
      ),
    })),
  ) as StorageHooks<S>
}

export const makeUseLocalItemFromStorage = <C extends ValidCodec>(
  key: string,
  v: LocalValueModifiers<C>,
): LocalValueHook<C> => () => {
  const [item, setItem] = React.useState(v.get() as decodeType<C>)

  const setItemMemo = React.useMemo(() => {
    return (i: ValidLocalValue<runtimeType<C>>) => () =>
      pipe(
        i,
        LV.fold2(
          () => {
            v.remove()
            setItem(v.get() as decodeType<C>)
          },
          (newValue) => {
            v.set(newValue)()
            setItem(v.get() as decodeType<C>)
          },
        ),
      )
  }, [item])

  const onLocalStorageChange = (
    event: StorageEvent | LocalStorageChangedEvent,
  ) => {
    if (isLocalStorageEvent(event)) {
      if (event.detail.key === key) {
        setItem(v.get() as decodeType<C>)
      }
    } else {
      if (event.key === key) {
        setItem(v.get() as decodeType<C>)
      }
    }
  }

  React.useEffect(() => {
    const listener = (e: Event) => {
      onLocalStorageChange(e as StorageEvent)
    }

    window.addEventListener(storeChangedCustomEvent, listener)
    // The storage event only works in the context of other documents (eg. other browser tabs)
    window.addEventListener("storage", listener)

    return () => {
      window.removeEventListener(storeChangedCustomEvent, listener)
      window.removeEventListener("storage", listener)
    }
  }, [key])

  return [item, setItemMemo]
}

type LocalValueHookFromModifiers<M> = M extends LocalValueModifiers<infer C>
  ? C extends ValidCodec
    ? LocalValueHook<C>
    : never
  : never

export type StorageHooksFromInstance<S> = S extends Record<infer K, any>
  ? [K] extends [string]
    ? {
        [k in K as `use${Capitalize<k>}`]: LocalValueHookFromModifiers<S[k]>
      }
    : never
  : never

export const makeHooksFromStorage = <S extends StorageInstance<any>>(
  storage: S,
): StorageHooksFromInstance<S> => {
  return pipe(
    storage,
    R.reduceWithIndex({}, (k, acc, v) => ({
      ...acc,
      [`use${capitalize(k)}`]: makeUseLocalItemFromStorage(k, v),
    })),
  ) as StorageHooksFromInstance<S>
}
