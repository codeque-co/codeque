import { RuleTester } from 'eslint'

global.ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  plugins: ['@codeque'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      globalReturn: true,
      jsx: true,
    },
  },
})
