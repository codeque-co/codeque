const sharedConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest/jest.shared.setup.ts'],
}

module.exports = {
  testPathIgnorePatterns: [
    '__fixtures__',
    '__fixturesOther__',
    'ts-dist',
    'utils.ts',
  ],
  projects: [
    {
      displayName: { name: 'common', color: 'white' },
      ...sharedConfig,
      setupFiles: [
        ...sharedConfig.setupFiles,
        '<rootDir>/jest/jest.common.setup.ts',
      ],
      testMatch: ['<rootDir>/__tests__/common/**/*.test.ts'],
    },
    {
      displayName: { name: 'typescript-eslint-parser', color: 'magenta' },
      ...sharedConfig,
      setupFiles: [
        ...sharedConfig.setupFiles,
        '<rootDir>/jest/jest.typescript-eslint-parser.setup.ts',
      ],
      testMatch: [
        '<rootDir>/__tests__/JavaScript/**/*.test.ts',
        '<rootDir>/__tests__/TypeScript/**/*.test.ts',
        '<rootDir>/__tests__/common/options.test.ts',
      ],
    },
    {
      displayName: { name: 'babel-eslint-parser', color: 'yellow' },
      ...sharedConfig,
      setupFiles: [
        ...sharedConfig.setupFiles,
        '<rootDir>/jest/jest.babel-eslint-parser.setup.ts',
      ],
      testMatch: [
        '<rootDir>/__tests__/JavaScript/**/*.test.ts',
        '<rootDir>/__tests__/common/options.test.ts',
      ],
    },
    {
      displayName: { name: 'esprima', color: 'gray' },
      ...sharedConfig,
      setupFiles: [
        ...sharedConfig.setupFiles,
        '<rootDir>/jest/jest.esprima.setup.ts',
      ],
      testMatch: [
        '<rootDir>/__tests__/JavaScript/**/*.test.ts',
        '<rootDir>/__tests__/common/options.test.ts',
      ],
    },
    {
      displayName: { name: 'espree', color: 'blue' },
      ...sharedConfig,
      setupFiles: [
        ...sharedConfig.setupFiles,
        '<rootDir>/jest/jest.espree.setup.ts',
      ],
      testMatch: [
        '<rootDir>/__tests__/JavaScript/**/*.test.ts',
        '<rootDir>/__tests__/common/options.test.ts',
      ],
    },
  ],
}
