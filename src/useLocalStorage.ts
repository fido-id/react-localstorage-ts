import * as React from "react"
import * as O from "fp-ts/Option"
import * as t from "io-ts"
import { pipe } from "fp-ts/lib/function"
import {
  isLocalStorageEvent,
  LocalStorageChangedEvent,
  localStorageProxy,
  MemoryStorageProxy,
  storeChangedCustomEvent,
} from "./localStorageProxy"

const memoryStore = new MemoryStorageProxy()

interface UseLocalItemOptions<C extends t.Type<any, string>> {
  useMemorySore?: boolean
  defaultValue?: t.TypeOf<C>
}

const getStore = <O extends UseLocalItemOptions<any>>(o?: O) =>
  o?.useMemorySore ?? false ? memoryStore : localStorageProxy

export const getLocalElement = <O extends UseLocalItemOptions<any>>(
  t: string,
  options?: O,
): O.Option<string> => {
  const store = getStore(options)
  return O.fromNullable(store.getItem(t))
}

export const setLocalElement = <O extends UseLocalItemOptions<any>>(
  t: string,
  v: string,
  options?: O,
): void => {
  const store = getStore(options)
  store.setItem(t, v)
}

export const removeLocalElement = <O extends UseLocalItemOptions<any>>(
  t: string,
  options?: O,
): void => {
  const store = getStore(options)
  store.removeItem(t)
}

export type LocalValueHook<C extends t.Type<any, string>> = () => [
  item: O.Option<t.Validation<t.TypeOf<C>>>,
  setItem: (i: O.Option<t.TypeOf<C>>) => void,
]

export const makeUseLocalItem = <C extends t.Type<any, string>>(
  key: string,
  codec: C,
  options?: UseLocalItemOptions<C>,
): LocalValueHook<C> => () => {
  const [item, setItem] = React.useState(getLocalElement(key, options))

  const itemMemo = React.useMemo(() => {
    return pipe(item, O.map(codec.decode))
  }, [item])

  const setItemMemo = React.useMemo(() => {
    return (i: O.Option<t.TypeOf<C>>) =>
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

    window.addEventListener(storeChangedCustomEvent, listener)
    // The storage event only works in the context of other documents (eg. other browser tabs)
    window.addEventListener("storage", listener)

    return () => {
      window.removeEventListener(storeChangedCustomEvent, listener)
      window.removeEventListener("storage", listener)
    }
  }, [key])

  return [itemMemo, setItemMemo]
}
