import { RuleTester } from 'eslint'

global.ruleTester = new RuleTester({
  parser: require.resolve('@babel/eslint-parser'),
  plugins: ['@codeque'],
  parserOptions: {
    requireConfigFile: false,
    allowImportExportEverywhere: true,
    babelOptions: {
      babelrc: false,
      configFile: false,
      parserOpts: {
        plugins: ['jsx'],
      },
    },
  },
})
