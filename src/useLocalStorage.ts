import * as React from "react"
import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import * as t from "io-ts"
import * as LV from "./LocalValue"
import { Lazy, pipe } from "fp-ts/lib/function"
import {
  isLocalStorageEvent,
  LocalStorageChangedEvent,
  localStorageProxy,
  MemoryStorageProxy,
} from "./localStorageProxy"

/**
 *  from outside you augment "StoredItems" like this:
 *
 *  declare module "fp-local-storage/StoredItems" {
 *    interface StoredItems {
 *      readonly access_token: string
 *    }
 *  }
 */

export interface StoredItems {}
export type StoredItem = keyof StoredItems

const memoryStore = new MemoryStorageProxy()

interface UseLocalItemOptions {
  useMemorySore?: boolean
}

const getStore = (o?: UseLocalItemOptions) =>
  o?.useMemorySore ?? false ? memoryStore : localStorageProxy

export const getLocalElement = (
  t: StoredItem,
  options?: UseLocalItemOptions,
): O.Option<string> => {
  const store = getStore(options)
  return O.fromNullable(store.getItem(t))
}

export const setLocalElement = (
  t: StoredItem,
  v: string,
  options?: UseLocalItemOptions,
): void => {
  const store = getStore(options)
  store.setItem(t, v)
}

export const removeLocalElement = (
  t: StoredItem,
  options?: UseLocalItemOptions,
): void => {
  const store = getStore(options)
  store.removeItem(t)
}

export type LocalValueHook<K> = K extends StoredItem
  ? () => [
      item: O.Option<t.Validation<StoredItems[K]>>,
      setItem: (i: O.Option<StoredItems[K]>) => void,
    ]
  : never

export type DefaultedLocalValueHook<K> = K extends StoredItem
  ? () => [
      item: t.Validation<StoredItems[K]>,
      setItem: (i: StoredItems[K]) => void,
    ]
  : never

type StoreItemOrNever<K> = K extends StoredItem ? K : never
type StoreItemValueOrNever<K> = K extends StoredItem ? StoredItems[K] : never

export const makeUseLocalItem = <K>(
  key: StoreItemOrNever<K>,
  codec: t.Type<StoreItemValueOrNever<K>, string>,
  options?: UseLocalItemOptions,
): LocalValueHook<K> =>
  (() => {
    const [item, setItem] = React.useState(getLocalElement(key, options))

    const itemMemo = React.useMemo(() => {
      return pipe(item, O.map(codec.decode))
    }, [item])

    const setItemMemo = React.useMemo(() => {
      return (i: O.Option<StoreItemValueOrNever<K>>) =>
        pipe(
          i,
          O.map(codec.encode),
          O.fold(
            () => {
              removeLocalElement(key, options)
              setItem(getLocalElement(key, options))
            },
            (newValue) => {
              setLocalElement(key, newValue, options)
              setItem(getLocalElement(key, options))
            },
          ),
        )
    }, [item])

    const onLocalStorageChange = (
      event: StorageEvent | LocalStorageChangedEvent,
    ) => {
      if (isLocalStorageEvent(event)) {
        if (event.detail.key === key) {
          setItem(getLocalElement(key, options))
        }
      } else {
        if (event.key === key) {
          setItem(getLocalElement(key, options))
        }
      }
    }

    React.useEffect(() => {
      const listener = (e: Event) => {
        onLocalStorageChange(e as StorageEvent)
      }

      window.addEventListener("onLocalStorageChange", listener)
      // The storage event only works in the context of other documents (eg. other browser tabs)
      window.addEventListener("storage", listener)

      return () => {
        window.removeEventListener("onLocalStorageChange", listener)
        window.removeEventListener("storage", listener)
      }
    }, [key])

    return [itemMemo, setItemMemo]
  }) as LocalValueHook<K>

type HookDefaultValue<K> = K extends StoredItem ? Lazy<StoredItems[K]> : never

export const makeDefaultedUseLocalItem = <K>(
  key: StoreItemOrNever<K>,
  codec: t.Type<StoreItemValueOrNever<K>, string>,
  defaultValue: HookDefaultValue<K>,
  options?: UseLocalItemOptions,
): DefaultedLocalValueHook<K> =>
  (() => {
    const hook = React.useMemo(() => makeUseLocalItem(key, codec, options), [])
    const [item, setItem] = hook()

    const defaultedItem = React.useMemo(() => {
      return pipe(
        item,
        LV.toEither(() => E.of(defaultValue())),
      )
    }, [item])

    const setDefaultedItem = React.useMemo(() => {
      return (i: StoreItemOrNever<K>) => setItem(O.some(i))
    }, [setItem])

    return [defaultedItem, setDefaultedItem]
  }) as DefaultedLocalValueHook<K>
