module.exports = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsConfig: "./tsconfig.json",
    },
  },
  transform: { "^.+typespec\\.ts$": "dts-jest/transform" },
  testMatch: ["**/+(*.)*(typespec).ts"],
  name: "react-localstorage-ts",
  displayName: "react-localstorage-ts",
}
