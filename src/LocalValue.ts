import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import { Kind2, URIS2 } from "fp-ts/HKT"
import { Functor2 } from "fp-ts/Functor"
import { Lazy } from "fp-ts/function"
import { pipe } from "fp-ts/pipeable"
import { Monad2 } from "fp-ts/Monad"
import { Alternative2 } from "fp-ts/Alternative"
import { Applicative2 } from "fp-ts/Applicative"
import { Foldable2 } from "fp-ts/Foldable"
import { Monoid } from "fp-ts/Monoid"
import { Either } from "./Either"
import { Option } from "./Option"

export interface Absent {
  readonly _tag: "Absent"
}

export interface Invalid<E> {
  readonly _tag: "Invalid"
  readonly errors: E
}
export interface Valid<A> {
  readonly _tag: "Valid"
  readonly value: A
}

export type LocalValue<E, A> = Absent | Invalid<E> | Valid<A>

export const URI = "LocalValue"
export type URI = typeof URI

declare module "fp-ts/HKT" {
  interface URItoKind2<E, A> {
    readonly [URI]: LocalValue<E, A>
  }
}

interface OptionalGetter<F extends URIS2> {
  readonly getOrElse: <E, A>(f: Lazy<A>) => (fa: Kind2<F, E, A>) => A
}

// -------------------------------------------------------------------------------------
// non-pipeables
// -------------------------------------------------------------------------------------

const _map = <E, A, B>(
  lv: LocalValue<E, A>,
  f: (a: A) => B,
): LocalValue<E, B> => {
  if (isAbsent(lv) || isInvalid(lv)) {
    return lv
  }

  return valid(f(lv.value))
}

const _ap = <E, A, B>(
  apLocalValue: LocalValue<E, (a: A) => B>,
  lv: LocalValue<E, A>,
): LocalValue<E, B> => {
  return _chain(apLocalValue, (f) => _map(lv, (a) => f(a)))
}

const _chain = <E, A, B>(
  lv: LocalValue<E, A>,
  f: (a: A) => LocalValue<E, B>,
): LocalValue<E, B> => {
  if (isAbsent(lv) || isInvalid(lv)) {
    return lv
  }

  return f(lv.value)
}

const _zero = () => absent

const _alt = <E, A>(lv: LocalValue<E, A>, la: Lazy<LocalValue<E, A>>) => {
  if (isAbsent(lv) || isInvalid(lv)) {
    return lv
  }

  return la()
}

const _reduce = <E, A, B>(
  fa: LocalValue<E, A>,
  b: B,
  f: (b: B, a: A) => B,
): B => {
  return fold(
    () => b,
    () => b,
    (a: A) => f(b, a),
  )(fa)
}
const _foldMap = <M>(M: Monoid<M>) => <E, A>(
  fa: LocalValue<E, A>,
  f: (a: A) => M,
): M => {
  return fold(
    () => M.empty,
    () => M.empty,
    (a: A) => f(a),
  )(fa)
}
const _reduceRight = <E, A, B>(
  fa: LocalValue<E, A>,
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

export const fold = <E, A, B>(
  onNone: () => B,
  onError: (e: E) => B,
  onValue: (a: A) => B,
) => (fa: LocalValue<E, A>): B => {
  if (isAbsent(fa)) {
    return onNone()
  }
  if (isInvalid(fa)) {
    return onError(fa.errors)
  }

  return onValue(fa.value)
}

export const fold2 = <E, A, B>(onNone: () => B, onValue: (a: A) => B) => (
  fa: LocalValue<E, A>,
): B => {
  if (isAbsent(fa) || isInvalid(fa)) {
    return onNone()
  }

  return onValue(fa.value)
}

export const getOrElse = <E, A>(defaultValue: Lazy<A>) => (
  lv: LocalValue<E, A>,
): A => {
  if (isAbsent(lv) || isInvalid(lv)) {
    return defaultValue()
  }

  return lv.value
}

export const of = <E, A>(v: A): LocalValue<E, A> => valid(v)

export const chain = <E, A, B>(f: (a: A) => LocalValue<E, B>) => (
  lv: LocalValue<E, A>,
): LocalValue<E, B> => {
  return _chain(lv, f)
}

export const map = <E, A, B>(f: (a: A) => B) => (
  lv: LocalValue<E, A>,
): LocalValue<E, B> => {
  return _map(lv, f)
}

export const fromOption = <A>(o: Option<A>): LocalValue<never, A> =>
  pipe(
    o,
    O.fold(
      () => absent,
      (v) => valid(v) as LocalValue<never, A>,
    ),
  )

export const fromEither = <E, A>(e: Either<E, A>): LocalValue<E, A> =>
  pipe(
    e,
    E.fold(invalid, (v) => valid(v) as LocalValue<E, A>),
  )

export const toOption = <E, A>(v: LocalValue<E, A>): Option<A> =>
  pipe(
    v,
    fold(
      () => O.none,
      () => O.none,
      (v) => O.some(v),
    ),
  )

export const toEither = <E, A>(onNone: Lazy<E>) => (
  v: LocalValue<E, A>,
): Either<E, A> => {
  return pipe(
    v,
    fold(() => E.left(onNone()), E.left, E.right),
  )
}

export const alt = <E, A>(la: Lazy<LocalValue<E, A>>) => (
  lv: LocalValue<E, A>,
) => {
  return _alt(lv, la)
}

export const isAbsent = (lv: LocalValue<any, any>): lv is Absent => {
  return lv._tag === "Absent"
}

export const isValid = <A>(lv: LocalValue<any, A>): lv is Valid<A> => {
  return lv._tag === "Valid"
}

export const isInvalid = <E>(lv: LocalValue<E, any>): lv is Invalid<E> => {
  return lv._tag === "Invalid"
}

export const absent: LocalValue<never, never> = {
  _tag: "Absent",
}

export const valid = <A>(v: A): Valid<A> => {
  return { _tag: "Valid", value: v }
}

export const invalid = <E>(e: E): Invalid<E> => {
  return { _tag: "Invalid", errors: e }
}

export const localValue: Functor2<URI> &
  Monad2<URI> &
  Alternative2<URI> &
  Applicative2<URI> &
  Foldable2<URI> &
  OptionalGetter<URI> = {
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
