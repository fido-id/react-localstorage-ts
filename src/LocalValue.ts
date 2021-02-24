import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import * as t from "io-ts"
import { Kind, URIS } from "fp-ts/HKT"
import { Functor1 } from "fp-ts/Functor"
import { identity, Lazy } from "fp-ts/function"
import { pipe } from "fp-ts/pipeable"
import { Monad1 } from "fp-ts/Monad"
import { Alternative1 } from "fp-ts/Alternative"
import { Applicative1 } from "fp-ts/Applicative"
import { Foldable1 } from "fp-ts/Foldable"
import { Monoid } from "fp-ts/Monoid"

export type LocalValue<V> = O.Option<E.Either<t.Errors, V>>

export const URI = "LocalValue"
export type URI = typeof URI

declare module "fp-ts/HKT" {
  interface URItoKind<A> {
    readonly [URI]: LocalValue<A>
  }
}

interface OptionalGetter<F extends URIS> {
  readonly getOrElse: <A>(f: Lazy<A>) => (fa: Kind<F, A>) => A
}

interface MaybeError<F extends URIS>
  extends Functor1<F>,
    Monad1<F>,
    Alternative1<F>,
    Applicative1<F>,
    Foldable1<F>,
    OptionalGetter<F> {}

// -------------------------------------------------------------------------------------
// non-pipeables
// -------------------------------------------------------------------------------------

const _map = <A, B>(localValue: LocalValue<A>, f: (a: A) => B): LocalValue<B> =>
  pipe(
    localValue,
    O.map((v) => E.map(f)(v)),
  )

const _ap = <A, B>(
  apLocalValue: LocalValue<(a: A) => B>,
  localValue: LocalValue<A>,
): LocalValue<B> => {
  return _chain(apLocalValue, (f) => _map(localValue, (a) => f(a)))
}

const _chain = <A, B>(
  localValue: LocalValue<A>,
  f: (a: A) => LocalValue<B>,
): LocalValue<B> =>
  pipe(
    localValue,
    O.chain((v) => {
      if (E.isRight(v)) {
        return f(v.right)
      } else {
        return O.of(v)
      }
    }),
  )

const _zero = () => O.none

const _alt = <V>(lv: LocalValue<V>, la: Lazy<LocalValue<V>>) => {
  return pipe(
    lv,
    O.chain((e) => {
      if (E.isLeft(e)) {
        return la()
      } else {
        return O.some(e)
      }
    }),
  )
}

const _reduce = <A, B>(fa: LocalValue<A>, b: B, f: (b: B, a: A) => B): B => {
  return fold(
    () => b,
    () => b,
    (a: A) => f(b, a),
  )(fa)
}
const _foldMap = <M>(M: Monoid<M>) => <A>(
  fa: LocalValue<A>,
  f: (a: A) => M,
): M => {
  return fold(
    () => M.empty,
    () => M.empty,
    (a: A) => f(a),
  )(fa)
}
const _reduceRight = <A, B>(
  fa: LocalValue<A>,
  b: B,
  f: (a: A, b: B) => B,
): B => {
  return fold(
    () => b,
    () => b,
    (a: A) => f(a, b),
  )(fa)
}

// -------------------------------------------------------------------------------------
// pipeables
// -------------------------------------------------------------------------------------

export const fold = <A, B>(
  onNone: () => B,
  onError: (e: t.Errors) => B,
  onValue: (a: A) => B,
) => (fa: LocalValue<A>): B => {
  if (fa._tag === "None") {
    return onNone()
  }
  if (fa.value._tag === "Left") {
    return onError(fa.value.left)
  }

  return onValue(fa.value.right)
}

export const getOrElse = <V>(defaultValue: Lazy<V>) => (
  localValue: LocalValue<V>,
): V =>
  pipe(localValue, O.map(E.getOrElse(defaultValue)), O.getOrElse(defaultValue))

export const of = <A>(v: A): LocalValue<A> => O.of(E.of(v))

export const chain = <A, B>(f: (a: A) => LocalValue<B>) => (
  localValue: LocalValue<A>,
): LocalValue<B> =>
  pipe(
    localValue,
    O.chain((v) => {
      if (E.isRight(v)) {
        return f(v.right)
      } else {
        return O.of(v)
      }
    }),
  )

export const map = <A, B>(f: (a: A) => B) => (
  localValue: LocalValue<A>,
): LocalValue<B> =>
  pipe(
    localValue,
    O.map((v) => E.map(f)(v)),
  )

export const fromOption = <V>(o: O.Option<V>): LocalValue<V> =>
  pipe(o, O.map(E.right))

export const fromEither = <V>(e: E.Either<t.Errors, V>): LocalValue<V> =>
  O.some(e)

export const toOption = <V>(v: LocalValue<V>) =>
  pipe(
    v,
    O.chain(
      E.fold(
        () => O.none,
        (v) => O.some(v),
      ),
    ),
  )

export const toEither = <V>(onNone: Lazy<t.Validation<V>>) => (
  v: LocalValue<V>,
) => pipe(v, O.fold(onNone, identity))

export const alt = <V>(la: Lazy<LocalValue<V>>) => (lv: LocalValue<V>) => {
  return pipe(
    lv,
    O.chain((e) => {
      if (E.isLeft(e)) {
        return la()
      } else {
        return O.some(e)
      }
    }),
  )
}

export const localValue: MaybeError<URI> = {
  URI,
  map: _map,
  chain: _chain,
  getOrElse,
  of,
  ap: _ap,
  zero: _zero,
  alt: _alt,
  reduce: _reduce,
  reduceRight: _reduceRight,
  foldMap: _foldMap,
}
