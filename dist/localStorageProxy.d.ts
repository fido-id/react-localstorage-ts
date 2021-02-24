import { StoredItem } from "./useLocalStorage";
export declare function localStorageAvailable(): boolean;
export interface LocalStorageChangedEvent {
    detail: {
        key: StoredItem;
    };
}
export declare const isLocalStorageEvent: (e: any) => e is LocalStorageChangedEvent;
interface IProxyStorage {
    getItem(key: string): string | null;
    setItem(Key: string, value: string): void;
    removeItem(key: string): void;
}
export declare class LocalStorageProxy implements IProxyStorage {
    getItem(key: StoredItem): string | null;
    setItem(key: StoredItem, value: string): void;
    removeItem(key: StoredItem): void;
}
export declare class MemoryStorageProxy implements IProxyStorage {
    private _memoryStorage;
    getItem(key: StoredItem): string | null;
    setItem(key: StoredItem, value: string): void;
    removeItem(key: StoredItem): void;
}
export declare const localStorageProxy: LocalStorageProxy | MemoryStorageProxy;
export {};
