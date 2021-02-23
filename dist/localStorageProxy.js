"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.localStorageProxy = exports.MemoryStorageProxy = exports.LocalStorageProxy = exports.isLocalStorageEvent = exports.LocalStorageChangedEvent = exports.localStorageAvailable = void 0;
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
var LocalStorageChangedEvent = /** @class */ (function (_super) {
    __extends(LocalStorageChangedEvent, _super);
    function LocalStorageChangedEvent(key) {
        return _super.call(this, LocalStorageChangedEvent.eventName, { detail: { key: key } }) || this;
    }
    LocalStorageChangedEvent.eventName = "onLocalStorageChange";
    return LocalStorageChangedEvent;
}(CustomEvent));
exports.LocalStorageChangedEvent = LocalStorageChangedEvent;
var isLocalStorageEvent = function (e) {
    return e instanceof LocalStorageChangedEvent;
};
exports.isLocalStorageEvent = isLocalStorageEvent;
var dispatchCustomEvent = function (key) {
    return window.dispatchEvent(new LocalStorageChangedEvent(key));
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
