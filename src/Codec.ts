import * as LV from "./LocalValue"

export interface Codec<E, A, B> {
  encode: (b: B) => A
  decode: (b: unknown) => LV.LocalValue<E, B>
}

export type decodeType<C> = C extends Codec<infer E, any, infer B>
  ? LV.LocalValue<E, B>
  : never
export type runtimeType<C> = C extends Codec<any, any, infer B> ? B : never
export type errorType<C> = C extends Codec<infer B, any, any> ? B : never
