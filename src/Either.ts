export interface Left<E> {
  readonly _tag: "Left"
  readonly left: E
}

export interface Right<A> {
  readonly _tag: "Right"
  readonly right: A
}

export declare type Either<E, A> = Left<E> | Right<A>
