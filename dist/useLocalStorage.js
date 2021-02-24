"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDefaultedUseLocalItem = exports.makeUseLocalItem = exports.removeLocalElement = exports.setLocalElement = exports.getLocalElement = void 0;
var React = __importStar(require("react"));
var O = __importStar(require("fp-ts/Option"));
var E = __importStar(require("fp-ts/Either"));
var LV = __importStar(require("./LocalValue"));
var function_1 = require("fp-ts/lib/function");
var localStorageProxy_1 = require("./localStorageProxy");
var memoryStore = new localStorageProxy_1.MemoryStorageProxy();
var getStore = function (o) { var _a; return ((_a = o === null || o === void 0 ? void 0 : o.useMemorySore) !== null && _a !== void 0 ? _a : false) ? memoryStore : localStorageProxy_1.localStorageProxy; };
var getLocalElement = function (t, options) {
    var store = getStore(options);
    return O.fromNullable(store.getItem(t));
};
exports.getLocalElement = getLocalElement;
var setLocalElement = function (t, v, options) {
    var store = getStore(options);
    store.setItem(t, v);
};
exports.setLocalElement = setLocalElement;
var removeLocalElement = function (t, options) {
    var store = getStore(options);
    store.removeItem(t);
};
exports.removeLocalElement = removeLocalElement;
var makeUseLocalItem = function (key, codec, options) {
    return (function () {
        var _a = React.useState(exports.getLocalElement(key, options)), item = _a[0], setItem = _a[1];
        var itemMemo = React.useMemo(function () {
            return function_1.pipe(item, O.map(codec.decode));
        }, [item]);
        var setItemMemo = React.useMemo(function () {
            return function (i) {
                return function_1.pipe(i, O.map(codec.encode), O.fold(function () {
                    exports.removeLocalElement(key, options);
                    setItem(exports.getLocalElement(key, options));
                }, function (newValue) {
                    exports.setLocalElement(key, newValue, options);
                    setItem(exports.getLocalElement(key, options));
                }));
            };
        }, [item]);
        var onLocalStorageChange = function (event) {
            if (localStorageProxy_1.isLocalStorageEvent(event)) {
                if (event.detail.key === key) {
                    setItem(exports.getLocalElement(key, options));
                }
            }
            else {
                if (event.key === key) {
                    setItem(exports.getLocalElement(key, options));
                }
            }
        };
        React.useEffect(function () {
            var listener = function (e) {
                onLocalStorageChange(e);
            };
            window.addEventListener("onLocalStorageChange", listener);
            // The storage event only works in the context of other documents (eg. other browser tabs)
            window.addEventListener("storage", listener);
            return function () {
                window.removeEventListener("onLocalStorageChange", listener);
                window.removeEventListener("storage", listener);
            };
        }, [key]);
        return [itemMemo, setItemMemo];
    });
};
exports.makeUseLocalItem = makeUseLocalItem;
var makeDefaultedUseLocalItem = function (key, codec, defaultValue, options) {
    return (function () {
        var hook = React.useMemo(function () { return exports.makeUseLocalItem(key, codec, options); }, []);
        var _a = hook(), item = _a[0], setItem = _a[1];
        var defaultedItem = React.useMemo(function () {
            return function_1.pipe(item, LV.toEither(function () { return E.of(defaultValue()); }));
        }, [item]);
        var setDefaultedItem = React.useMemo(function () {
            return function (i) { return setItem(O.some(i)); };
        }, [setItem]);
        return [defaultedItem, setDefaultedItem];
    });
};
exports.makeDefaultedUseLocalItem = makeDefaultedUseLocalItem;
