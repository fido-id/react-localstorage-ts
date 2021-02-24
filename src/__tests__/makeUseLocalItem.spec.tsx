import * as React from "react"
import { pipe } from "fp-ts/lib/function"
import * as O from "fp-ts/Option"
import { renderHook } from "@testing-library/react-hooks"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { makeUseLocalItem } from "../../dist/useLocalStorage"
import * as LV from "../../dist/LocalValue"

import {
  defaultShape,
  localStorageKey,
  ShapeCodecFromString,
} from "./makeDefaultedUseLocalItem.spec"

const useShape = makeUseLocalItem("shape", ShapeCodecFromString)

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe("makeUseLocalItem", () => {
  it("a valid value is correctly accesses", () => {
    localStorage.setItem(
      localStorageKey,
      ShapeCodecFromString.encode(defaultShape),
    )

    const { result } = renderHook(() => useShape())

    expect(result.current[0]).toEqual(LV.of(defaultShape))
  })

  it("an invalid value is correctly accesses", () => {
    localStorage.setItem(localStorageKey, "foo")

    const { result } = renderHook(() => useShape())

    expect(LV.isError(result.current[0])).toBe(true)
  })

  it("a missing value is correctly accesses", () => {
    const { result } = renderHook(() => useShape())

    expect(result.current[0]).toEqual(O.none)
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
