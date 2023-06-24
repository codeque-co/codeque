import { RuleTester } from 'eslint'

global.ruleTester = new RuleTester({
  parser: require.resolve('esprima'),
  plugins: ['@codeque'],
  parserOptions: {
    jsx: true,
  },
})
