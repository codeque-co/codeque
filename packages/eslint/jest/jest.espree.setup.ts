import { RuleTester } from 'eslint'

global.ruleTester = new RuleTester({
  parser: require.resolve('espree'),
  plugins: ['@codeque'],
  parserOptions: {
    ecmaVersion: 'latest',
    ecmaFeatures: {
      jsx: true,
      globalReturn: true,
      impliedStrict: false,
    },
  },
})
