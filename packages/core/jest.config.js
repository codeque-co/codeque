const sharedConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest/shared.setup.ts'],
}

const javaScriptWithJSXParserTestFiles = [
  '<rootDir>/__tests__/JavaScript/**/*.test.ts',
  '<rootDir>/__tests__/JavaScriptWithJSX/**/*.test.ts',
]

const typeScriptParserTestFiles = [
  '<rootDir>/__tests__/JavaScript/**/*.test.ts',
  '<rootDir>/__tests__/JavaScriptWithJSX/**/*.test.ts',
  '<rootDir>/__tests__/TypeScript/**/*.test.ts',
]

const htmlParserTestFiles = ['<rootDir>/__tests__/HTML/**/*.test.ts']
const cssParserTestFiles = ['<rootDir>/__tests__/CSS/**/*.test.ts']

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
      testMatch: ['<rootDir>/__tests__/common/**/*.test.ts'],
    },
    {
      displayName: { name: 'text-search', color: 'cyan' },
      ...sharedConfig,
      testMatch: ['<rootDir>/__tests__/TextSearch/**/*.test.ts'],
    },
    {
      ...sharedConfig,
      displayName: { name: 'typescript-eslint-parser', color: 'magenta' },
      testMatch: typeScriptParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/typescript-eslint-parser.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: {
        name: 'typescript-eslint-parser:traversal',
        color: 'magenta',
      },
      testMatch: typeScriptParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/typescript-eslint-parser:traversal.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: { name: 'babel', color: 'yellow' },
      testMatch: typeScriptParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/babel.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: {
        name: 'babel:traversal',
        color: 'yellow',
      },
      testMatch: typeScriptParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/babel:traversal.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: { name: 'babel-eslint-parser', color: 'yellow' },
      testMatch: javaScriptWithJSXParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/babel-eslint-parser.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: {
        name: 'babel-eslint-parser:traversal',
        color: 'yellow',
      },
      testMatch: javaScriptWithJSXParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/babel-eslint-parser:traversal.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: { name: 'esprima', color: 'gray' },
      testMatch: javaScriptWithJSXParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/esprima.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: { name: 'esprima:traversal', color: 'gray' },
      testMatch: javaScriptWithJSXParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/esprima:traversal.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: { name: 'espree', color: 'blue' },
      testMatch: javaScriptWithJSXParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/espree.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: { name: 'espree:traversal', color: 'blue' },
      testMatch: javaScriptWithJSXParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/espree:traversal.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: { name: 'angular-eslint-template-parser', color: 'orange' },
      testMatch: htmlParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/angular-eslint-template-parser.setup.ts',
      ],
    },
    {
      ...sharedConfig,
      displayName: { name: 'css-tree', color: 'blue' },
      testMatch: cssParserTestFiles,
      setupFiles: [
        '<rootDir>/jest/shared.setup.ts',
        '<rootDir>/jest/css-tree.setup.ts',
      ],
    },
  ],
}
