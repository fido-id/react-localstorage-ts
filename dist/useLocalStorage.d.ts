import * as O from "fp-ts/Option";
import * as t from "io-ts";
import { Lazy } from "fp-ts/lib/function";
/**
 *  from outside you augment "StoredItems" like this:
 *
 *  declare module "fp-local-storage/StoredItems" {
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
export declare type LocalValueHook<K extends StoredItem> = () => [
    item: O.Option<t.Validation<StoredItems[K]>>,
    setItem: (i: O.Option<StoredItems[K]>) => void
];
export declare type DefaultedLocalValueHook<K extends StoredItem> = () => [
    item: t.Validation<StoredItems[K]>,
    setItem: (i: StoredItems[K]) => void
];
export declare const makeUseLocalItem: <K extends never>(key: K, codec: t.Type<StoredItems[K], string, unknown>, options?: UseLocalItemOptions | undefined) => LocalValueHook<K>;
export declare const useDefaultedLocalItem: <K extends never>(hook: LocalValueHook<K>, defaultValue: Lazy<StoredItems[K]>) => DefaultedLocalValueHook<K>;
export {};
