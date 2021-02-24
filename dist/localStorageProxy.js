"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localStorageProxy = exports.MemoryStorageProxy = exports.LocalStorageProxy = exports.isLocalStorageEvent = exports.localStorageAvailable = void 0;
function localStorageAvailable() {
    try {
        var x = "@rehooks/local-storage:" + new Date().toISOString();
        localStorage.setItem(x, x);
        localStorage.removeItem(x);
        return true;
    }
    catch (e) {
        return (e instanceof DOMException &&
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
            localStorage.length !== 0);
    }
}
exports.localStorageAvailable = localStorageAvailable;
var createLocalStorageChangedEvent = function (key) {
    return new CustomEvent("onLocalStorageChange", { detail: { key: key } });
};
var isLocalStorageEvent = function (e) {
    var _a;
    return typeof ((_a = e === null || e === void 0 ? void 0 : e.detail) === null || _a === void 0 ? void 0 : _a.key) === "string";
};
exports.isLocalStorageEvent = isLocalStorageEvent;
var dispatchCustomEvent = function (key) {
    return window.dispatchEvent(createLocalStorageChangedEvent(key));
};
var LocalStorageProxy = /** @class */ (function () {
    function LocalStorageProxy() {
    }
    LocalStorageProxy.prototype.getItem = function (key) {
        return localStorage.getItem(key);
    };
    LocalStorageProxy.prototype.setItem = function (key, value) {
        localStorage.setItem(key, value);
        dispatchCustomEvent(key);
    };
    LocalStorageProxy.prototype.removeItem = function (key) {
        localStorage.removeItem(key);
        dispatchCustomEvent(key);
    };
    return LocalStorageProxy;
}());
exports.LocalStorageProxy = LocalStorageProxy;
var MemoryStorageProxy = /** @class */ (function () {
    function MemoryStorageProxy() {
        this._memoryStorage = new Map();
    }
    MemoryStorageProxy.prototype.getItem = function (key) {
        var _a;
        return (_a = this._memoryStorage.get(key)) !== null && _a !== void 0 ? _a : null;
    };
    MemoryStorageProxy.prototype.setItem = function (key, value) {
        this._memoryStorage.set(key, value);
        dispatchCustomEvent(key);
    };
    MemoryStorageProxy.prototype.removeItem = function (key) {
        this._memoryStorage.delete(key);
        dispatchCustomEvent(key);
    };
    return MemoryStorageProxy;
}());
exports.MemoryStorageProxy = MemoryStorageProxy;
exports.localStorageProxy = localStorageAvailable()
    ? new LocalStorageProxy()
    : new MemoryStorageProxy();
