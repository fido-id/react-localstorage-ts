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

export type LocalValueHook<K extends StoredItem> = () => [
  item: O.Option<t.Validation<StoredItems[K]>>,
  setItem: (i: O.Option<StoredItems[K]>) => void,
]

export type DefaultedLocalValueHook<K extends StoredItem> = () => [
  item: t.Validation<StoredItems[K]>,
  setItem: (i: StoredItems[K]) => void,
]

export const makeUseLocalItem = <K extends StoredItem>(
  key: K,
  codec: t.Type<StoredItems[K], string>,
  options?: UseLocalItemOptions,
): LocalValueHook<K> => () => {
  const [item, setItem] = React.useState(getLocalElement(key, options))

  const itemMemo = React.useMemo(() => {
    return pipe(item, O.map(codec.decode))
  }, [item])

  const setItemMemo = React.useMemo(() => {
    return (i: O.Option<StoredItems[K]>) =>
      pipe(
        i,
        O.map(codec.encode),
        O.fold(
          () => {
            removeLocalElement(key, options)
            setItem(getLocalElement(key, options))
          },
          (newValue: string) => {
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
}

export const useDefaultedLocalItem = <K extends StoredItem>(
  hook: LocalValueHook<K>,
  defaultValue: Lazy<StoredItems[K]>,
): DefaultedLocalValueHook<K> => () => {
  const [item, setItem] = hook()

  const defaultedItem = React.useMemo(() => {
    return pipe(
      item,
      LV.toEither(() => E.of(defaultValue())),
    )
  }, [item])

  const setDefaultedItem = React.useMemo(() => {
    return (i: StoredItems[K]) => setItem(O.some(i))
  }, [setItem])

  return [defaultedItem, setDefaultedItem]
}
