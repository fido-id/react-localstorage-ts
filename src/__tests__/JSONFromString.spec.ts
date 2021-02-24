import { JSONFromString } from "../../dist/JSONFromString"
import { PathReporter } from "io-ts/PathReporter"

describe("JSONFromString", () => {
  it("decoding should fail with incorrect JSON string", function () {
    const result = JSONFromString.decode('{a:"ciao"}')
    expect(PathReporter.report(result)).toEqual([
      'Invalid value "JSON string" supplied to : JSONFromString',
    ])
  })

  it("decoding should succeed with correct JSON string", function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((JSONFromString.decode('{"foo":"baz"}') as any).right).toEqual({
      foo: "baz",
    })
  })
})
