export interface None {
  readonly _tag: "None"
}

export interface Some<A> {
  readonly _tag: "Some"
  readonly value: A
}

export type Option<A> = None | Some<A>
