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
exports.localValue = exports.alt = exports.toEither = exports.toOption = exports.fromEither = exports.fromOption = exports.map = exports.chain = exports.of = exports.getOrElse = exports.URI = void 0;
var O = __importStar(require("fp-ts/Option"));
var E = __importStar(require("fp-ts/Either"));
var function_1 = require("fp-ts/function");
var pipeable_1 = require("fp-ts/pipeable");
exports.URI = "LocalValue";
// -------------------------------------------------------------------------------------
// non-pipeables
// -------------------------------------------------------------------------------------
var _map = function (localValue, f) {
    return pipeable_1.pipe(localValue, O.map(function (v) { return E.map(f)(v); }));
};
var _ap = function (apLocalValue, localValue) {
    return _chain(apLocalValue, function (f) { return _map(localValue, function (a) { return f(a); }); });
};
var _chain = function (localValue, f) {
    return pipeable_1.pipe(localValue, O.chain(function (v) {
        if (E.isRight(v)) {
            return f(v.right);
        }
        else {
            return O.of(v);
        }
    }));
};
var _zero = function () { return O.none; };
var _alt = function (lv, la) {
    return pipeable_1.pipe(lv, O.chain(function (e) {
        if (E.isLeft(e)) {
            return la();
        }
        else {
            return O.some(e);
        }
    }));
};
// -------------------------------------------------------------------------------------
// pipeables
// -------------------------------------------------------------------------------------
var getOrElse = function (defaultValue) { return function (localValue) {
    return pipeable_1.pipe(localValue, O.map(E.getOrElse(defaultValue)), O.getOrElse(defaultValue));
}; };
exports.getOrElse = getOrElse;
var of = function (v) { return O.of(E.of(v)); };
exports.of = of;
var chain = function (f) { return function (localValue) {
    return pipeable_1.pipe(localValue, O.chain(function (v) {
        if (E.isRight(v)) {
            return f(v.right);
        }
        else {
            return O.of(v);
        }
    }));
}; };
exports.chain = chain;
var map = function (f) { return function (localValue) {
    return pipeable_1.pipe(localValue, O.map(function (v) { return E.map(f)(v); }));
}; };
exports.map = map;
var fromOption = function (o) {
    return pipeable_1.pipe(o, O.map(E.right));
};
exports.fromOption = fromOption;
var fromEither = function (e) {
    return O.some(e);
};
exports.fromEither = fromEither;
var toOption = function (v) {
    return pipeable_1.pipe(v, O.chain(E.fold(function () { return O.none; }, function (v) { return O.some(v); })));
};
exports.toOption = toOption;
var toEither = function (onNone) { return function (v) { return pipeable_1.pipe(v, O.fold(onNone, function_1.identity)); }; };
exports.toEither = toEither;
var alt = function (la) { return function (lv) {
    return pipeable_1.pipe(lv, O.chain(function (e) {
        if (E.isLeft(e)) {
            return la();
        }
        else {
            return O.some(e);
        }
    }));
}; };
exports.alt = alt;
exports.localValue = {
    URI: exports.URI,
    map: _map,
    chain: _chain,
    getOrElse: exports.getOrElse,
    of: exports.of,
    ap: _ap,
    zero: _zero,
    alt: _alt,
};
