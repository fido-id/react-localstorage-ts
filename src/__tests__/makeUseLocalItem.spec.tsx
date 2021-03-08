import * as React from "react"
import * as t from "io-ts"
import * as O from "fp-ts/Option"
import { pipe } from "fp-ts/lib/function"
import * as LV from "../LocalValue"
import { DateFromISOString } from "io-ts-types"
import { renderHook } from "@testing-library/react-hooks"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { makeUseLocalItem } from "../useLocalStorage"
import { fromIoTsCodec } from "../io-ts"

export const localStorageKey = "shape"

export const ShapeCodec = t.type({ s: t.string, d: DateFromISOString })
export type ShapeCodec = t.TypeOf<typeof ShapeCodec>

export const defaultShape: ShapeCodec = {
  s: "foo",
  d: new Date(1600732800 * 1000),
}

const CorrectCodec = fromIoTsCodec(ShapeCodec)

const useShape = makeUseLocalItem("shape", CorrectCodec)

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe("makeUseLocalItem", () => {
  it("a valid value is correctly accesses", () => {
    localStorage.setItem(localStorageKey, CorrectCodec.encode(defaultShape))

    const { result } = renderHook(() => useShape())

    expect(result.current[0]).toEqual(LV.of(defaultShape))
  })

  it("an invalid value is correctly accesses", () => {
    localStorage.setItem(localStorageKey, "foo")

    const { result } = renderHook(() => useShape())

    expect(LV.isInvalid(result.current[0])).toBe(true)
  })

  it("a missing value is correctly accesses", () => {
    const { result } = renderHook(() => useShape())

    expect(result.current[0]).toEqual(LV.absent)
  })

  it("component should rerender when local storage changes", () => {
    const testComponentId = "testComponentId"
    const testButtonId = "testButtonId"

    const Component = () => {
      const [shape] = useShape()
      const v = pipe(
        shape,
        LV.map((v) => v.s),
        LV.getOrElse(() => "bazz"),
      )

      return <span data-testid={testComponentId}>{v}</span>
    }

    const TestButton = () => {
      const [, setShape] = useShape()
      const newVal: any = O.of({ s: "bar", d: new Date() }) as any

      return (
        <button onClick={(_) => setShape(newVal)} data-testid={testButtonId}>
          Test Button
        </button>
      )
    }

    localStorage.setItem(localStorageKey, CorrectCodec.encode(defaultShape))

    const testComponent = render(<Component />)
    const testButton = render(<TestButton />)

    expect(testComponent.getByTestId(testComponentId).textContent).toBe(
      defaultShape.s,
    )

    fireEvent.click(testButton.getByTestId(testButtonId))

    expect(testComponent.getByTestId(testComponentId).textContent).toBe("bar")
  })
})
