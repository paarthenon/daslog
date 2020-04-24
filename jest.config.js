// pulled from https://github.com/basarat/typescript-book/blob/master/docs/testing/jest.md
module.exports = {
    "roots": [
        "<rootDir>/src"
    ],
    "modulePaths": [
        "<rootDir>/src",
        "<rootDir>/src/appender"
    ],
    "testMatch": [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
};
