import * as React from "react"
import { pipe } from "fp-ts/function"
import { Codec, decodeType, runtimeType } from "./Codec"
import { getLocalValue, setLocalValue, removeLocalValue } from "localvalue-ts"
import {
  isLocalStorageEvent,
  LocalStorageChangedEvent,
  storeChangedCustomEvent,
} from "localvalue-ts/localStorageProxy"
import * as LV from "./LocalValue"

type ValidCodec = Codec<any, string, any>

type ValidLocalValue<A> = LV.Absent | LV.Valid<A>

interface UseLocalItemOptions<C extends ValidCodec> {
  useMemorySore?: boolean
  defaultValue?: runtimeType<C>
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
    const [item, setItem] = React.useState(getLocalValue(key, codec, options))

    const setItemMemo = React.useMemo(() => {
      return (i: ValidLocalValue<runtimeType<C>>) =>
        pipe(
          i,
          LV.fold2(
            () => {
              removeLocalValue(key, options)
              setItem(getLocalValue(key, codec, options))
            },
            (newValue) => {
              setLocalValue(key, codec, newValue, options)
              setItem(getLocalValue(key, codec, options))
            },
          ),
        )
    }, [item])

    const onLocalStorageChange = (
      event: StorageEvent | LocalStorageChangedEvent,
    ) => {
      if (isLocalStorageEvent(event)) {
        if (event.detail.key === key) {
          setItem(getLocalValue(key, codec, options))
        }
      } else {
        if (event.key === key) {
          setItem(getLocalValue(key, codec, options))
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
  }) as LocalValueHook<C>
