import * as O from "fp-ts/Option";
import * as t from "io-ts";
import { Lazy } from "fp-ts/lib/function";
/**
 *  from outside you augment "StoredItems" like this:
 *
 *  declare module "react-localstorage-ts" {
 *    interface StoredItems {
 *      readonly access_token: string
 *    }
 *  }
 */
export interface StoredItems {
}
export declare type StoredItem = keyof StoredItems;
interface UseLocalItemOptions {
    useMemorySore?: boolean;
}
export declare const getLocalElement: (t: StoredItem, options?: UseLocalItemOptions | undefined) => O.Option<string>;
export declare const setLocalElement: (t: StoredItem, v: string, options?: UseLocalItemOptions | undefined) => void;
export declare const removeLocalElement: (t: StoredItem, options?: UseLocalItemOptions | undefined) => void;
export declare type LocalValueHook<K> = K extends StoredItem ? () => [
    item: O.Option<t.Validation<StoredItems[K]>>,
    setItem: (i: O.Option<StoredItems[K]>) => void
] : never;
export declare type DefaultedLocalValueHook<K> = K extends StoredItem ? () => [
    item: t.Validation<StoredItems[K]>,
    setItem: (i: StoredItems[K]) => void
] : never;
declare type StoreItemOrNever<K> = K extends StoredItem ? K : never;
declare type StoreItemValueOrNever<K> = K extends StoredItem ? StoredItems[K] : never;
export declare const makeUseLocalItem: <K>(key: StoreItemOrNever<K>, codec: t.Type<StoreItemValueOrNever<K>, string, unknown>, options?: UseLocalItemOptions | undefined) => LocalValueHook<K>;
declare type HookDefaultValue<K> = K extends StoredItem ? Lazy<StoredItems[K]> : never;
export declare const makeDefaultedUseLocalItem: <K>(key: StoreItemOrNever<K>, codec: t.Type<StoreItemValueOrNever<K>, string, unknown>, defaultValue: HookDefaultValue<K>, options?: UseLocalItemOptions | undefined) => DefaultedLocalValueHook<K>;
export {};
