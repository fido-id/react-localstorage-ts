import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as t from "io-ts";
import { Kind, URIS } from "fp-ts/HKT";
import { Functor1 } from "fp-ts/Functor";
import { Lazy } from "fp-ts/function";
import { Monad1 } from "fp-ts/Monad";
import { Alternative1 } from "fp-ts/Alternative";
import { Applicative1 } from "fp-ts/Applicative";
export declare type LocalValue<V> = O.Option<E.Either<t.Errors, V>>;
export declare const URI = "LocalValue";
export declare type URI = typeof URI;
declare module "fp-ts/HKT" {
    interface URItoKind<A> {
        readonly [URI]: LocalValue<A>;
    }
}
interface OptionalGetter<F extends URIS> {
    readonly getOrElse: <A>(f: Lazy<A>) => (fa: Kind<F, A>) => A;
}
interface MaybeError<F extends URIS> extends Functor1<F>, Monad1<F>, Alternative1<F>, Applicative1<F>, OptionalGetter<F> {
}
export declare const getOrElse: <V>(defaultValue: Lazy<V>) => (localValue: O.Option<E.Either<t.Errors, V>>) => V;
export declare const of: <A>(v: A) => O.Option<E.Either<t.Errors, A>>;
export declare const chain: <A, B>(f: (a: A) => O.Option<E.Either<t.Errors, B>>) => (localValue: O.Option<E.Either<t.Errors, A>>) => O.Option<E.Either<t.Errors, B>>;
export declare const map: <A, B>(f: (a: A) => B) => (localValue: O.Option<E.Either<t.Errors, A>>) => O.Option<E.Either<t.Errors, B>>;
export declare const fromOption: <V>(o: O.Option<V>) => O.Option<E.Either<t.Errors, V>>;
export declare const fromEither: <V>(e: E.Either<t.Errors, V>) => O.Option<E.Either<t.Errors, V>>;
export declare const toOption: <V>(v: O.Option<E.Either<t.Errors, V>>) => O.Option<V>;
export declare const toEither: <V>(onNone: Lazy<E.Either<t.Errors, V>>) => (v: O.Option<E.Either<t.Errors, V>>) => E.Either<t.Errors, V>;
export declare const alt: <V>(la: Lazy<O.Option<E.Either<t.Errors, V>>>) => (lv: O.Option<E.Either<t.Errors, V>>) => O.Option<E.Either<t.Errors, V>>;
export declare const localValue: MaybeError<URI>;
export {};
