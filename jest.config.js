module.exports = {
    "roots": [
        "<rootDir>/tests"
    ],
    testMatch: [ '**/*.test.ts'],
    "transform": {
        "^.+\\.ts$": "ts-jest"
    },
    collectCoverage: true,
    collectCoverageFrom: [
        "**/*.{ts,js}",
        "!**/*.d.{ts,js}",
        "!**/*.test.{ts,js}",
        "!**/node_modules/**",
        "!**/vendor/**"
    ],
    coverageThreshold: {
        global: {
            statements: 90,
            branches: 50,
            functions: 100,
            lines: 90,
        }
    },
}
