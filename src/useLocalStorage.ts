import * as React from "react"
import * as O from "fp-ts/Option"
import { pipe } from "fp-ts/lib/function"
import {
  isLocalStorageEvent,
  LocalStorageChangedEvent,
  localStorageProxy,
  MemoryStorageProxy,
  storeChangedCustomEvent,
} from "./localStorageProxy"
import { Codec, decodeType, runtimeType } from "./Codec"
import { Option } from "./Option"
import { Absent, Valid } from "./LocalValue"
import * as LV from "./LocalValue"

const memoryStore = new MemoryStorageProxy()

type ValidCodec = Codec<any, string, any>

type ValidLocalValue<A> = Absent | Valid<A>

interface UseLocalItemOptions<C extends ValidCodec> {
  useMemorySore?: boolean
  defaultValue?: runtimeType<C>
}

const getStore = <O extends UseLocalItemOptions<any>>(o?: O) =>
  o?.useMemorySore ?? false ? memoryStore : localStorageProxy

export const getLocalElement = <O extends UseLocalItemOptions<any>>(
  t: string,
  options?: O,
): Option<string> => {
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

export type LocalValueHook<C extends ValidCodec> = () => [
  item: decodeType<C>,
  setItem: (i: ValidLocalValue<runtimeType<C>>) => void,
]

export const makeUseLocalItem = <C extends ValidCodec>(
  key: string,
  codec: C,
  options?: UseLocalItemOptions<C>,
): LocalValueHook<C> =>
  (() => {
    const [item, setItem] = React.useState(getLocalElement(key, options))

    const itemMemo = React.useMemo(() => {
      return pipe(item, LV.fromOption, LV.chain(codec.decode))
    }, [item])

    const setItemMemo = React.useMemo(() => {
      return (i: ValidLocalValue<runtimeType<C>>) =>
        pipe(
          i,
          LV.map(codec.encode),
          LV.fold2(
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
  }) as LocalValueHook<C>
