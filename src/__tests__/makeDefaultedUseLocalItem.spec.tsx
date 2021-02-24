import * as t from "io-ts"
import * as React from "react"
import { DateFromISOString } from "io-ts-types"
import { pipe } from "fp-ts/lib/function"
import * as E from "fp-ts/Either"
import { renderHook } from "@testing-library/react-hooks"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { isoJSON, JSONFromString } from "../../dist/JSONFromString"
import { makeDefaultedUseLocalItem } from "../../dist/useLocalStorage"

export const localStorageKey = "shape"

declare module "../../dist/useLocalStorage" {
  interface StoredItems {
    readonly [localStorageKey]: { s: string; d: Date }
  }
}

export const ShapeCodec = t.type({ s: t.string, d: DateFromISOString })
export type ShapeCodec = t.TypeOf<typeof ShapeCodec>

export const defaultShape: ShapeCodec = {
  s: "foo",
  d: new Date(1600732800 * 1000),
}

export const ShapeCodecFromString = new t.Type<ShapeCodec, string>(
  "ShapeCodecFromString",
  ShapeCodec.is,
  (u, c) => {
    return pipe(
      JSONFromString.validate(u, c),
      E.chain((json) => ShapeCodec.validate(json, c)),
    )
  },
  (v) => {
    return pipe(v, ShapeCodec.encode, isoJSON.wrap, JSONFromString.encode)
  },
)

const useShape = makeDefaultedUseLocalItem(
  "shape",
  ShapeCodecFromString,
  () => defaultShape,
)

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe("makeDefaultedUseLocalItem", () => {
  it("a valid value is correctly accesses", () => {
    localStorage.setItem(
      localStorageKey,
      ShapeCodecFromString.encode(defaultShape),
    )

    const { result } = renderHook(() => useShape())

    expect(result.current[0]).toEqual(E.right(defaultShape))
  })

  it("an invalid value is correctly accesses", () => {
    localStorage.setItem(localStorageKey, "foo")

    const { result } = renderHook(() => useShape())

    expect(E.isLeft(result.current[0])).toBe(true)
  })

  it("a missing value is correctly accesses", () => {
    const { result } = renderHook(() => useShape())

    expect(result.current[0]).toEqual(E.right(defaultShape))
  })

  it("component should rerender when local storage changes", () => {
    const testComponentId = "testComponentId"
    const testButtonId = "testButtonId"

    const Component = () => {
      const [shape] = useShape()
      const v = pipe(
        shape,
        E.map((v) => v.s),
        E.getOrElse(() => "bazz"),
      )
      return <span data-testid={testComponentId}>{v}</span>
    }

    const TestButton = () => {
      const [, setShape] = useShape()

      return (
        <button
          onClick={(_) => setShape({ s: "bar", d: new Date() } as any)}
          data-testid={testButtonId}
        >
          Test Button
        </button>
      )
    }

    localStorage.setItem(
      localStorageKey,
      ShapeCodecFromString.encode(defaultShape),
    )

    const testComponent = render(<Component />)
    const testButton = render(<TestButton />)

    expect(testComponent.getByTestId(testComponentId).textContent).toBe(
      defaultShape.s,
    )

    fireEvent.click(testButton.getByTestId(testButtonId))

    expect(testComponent.getByTestId(testComponentId).textContent).toBe("bar")
  })
})
