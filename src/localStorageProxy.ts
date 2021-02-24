import { StoredItem } from "./useLocalStorage"

export function localStorageAvailable(): boolean {
  try {
    const x = "@rehooks/local-storage:" + new Date().toISOString()
    localStorage.setItem(x, x)
    localStorage.removeItem(x)
    return true
  } catch (e) {
    return (
      e instanceof DOMException &&
      // everything except Firefox
      (e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === "QuotaExceededError" ||
        // Firefox
        e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
      // acknowledge QuotaExceededError only if there's something already stored
      localStorage &&
      localStorage.length !== 0
    )
  }
}

export interface LocalStorageChangedEvent {
  detail: { key: StoredItem }
}

interface LocalStorageChangedEventPayload {
  key: StoredItem
}
const createLocalStorageChangedEvent = (
  key: StoredItem,
): CustomEvent<LocalStorageChangedEventPayload> => {
  return new CustomEvent("onLocalStorageChange", { detail: { key } })
}

export const isLocalStorageEvent = (e: any): e is LocalStorageChangedEvent => {
  return typeof e?.detail?.key === "string"
}

const dispatchCustomEvent = (key: StoredItem) =>
  window.dispatchEvent(createLocalStorageChangedEvent(key))

interface IProxyStorage {
  getItem(key: string): string | null
  setItem(Key: string, value: string): void
  removeItem(key: string): void
}

export class LocalStorageProxy implements IProxyStorage {
  getItem(key: StoredItem): string | null {
    return localStorage.getItem(key)
  }

  setItem(key: StoredItem, value: string): void {
    localStorage.setItem(key, value)
    dispatchCustomEvent(key)
  }

  removeItem(key: StoredItem): void {
    localStorage.removeItem(key)
    dispatchCustomEvent(key)
  }
}

export class MemoryStorageProxy implements IProxyStorage {
  private _memoryStorage = new Map<string, string>()

  getItem(key: StoredItem): string | null {
    return this._memoryStorage.get(key) ?? null
  }

  setItem(key: StoredItem, value: string): void {
    this._memoryStorage.set(key, value)
    dispatchCustomEvent(key)
  }

  removeItem(key: StoredItem): void {
    this._memoryStorage.delete(key)
    dispatchCustomEvent(key)
  }
}

export const localStorageProxy = localStorageAvailable()
  ? new LocalStorageProxy()
  : new MemoryStorageProxy()
