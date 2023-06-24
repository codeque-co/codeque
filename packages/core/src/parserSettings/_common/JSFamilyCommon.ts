import type { ParserOptions, ParserPlugin } from '@babel/parser'
export const numericWildcard = '0x0'
export const wildcardChar = '$'

export const supportedExtensions = [
  'js',
  'ts',
  'jsx',
  'tsx',
  'cjs',
  'mjs',
  'json',
]

export const babelPluginsWithoutJSX = [
  'typescript',
  'decorators-legacy',
  'importAssertions',
  'doExpressions',
] as ParserPlugin[]

export const babelPluginsWithJSX = [
  ...babelPluginsWithoutJSX,
  'jsx',
] as ParserPlugin[]

export const babelParseOptionsWithJSX = {
  sourceType: 'module',
  plugins: babelPluginsWithJSX,
  allowReturnOutsideFunction: true,
  allowImportExportEverywhere: true,
} as ParserOptions

export const babelParseOptionsWithoutJSX = {
  sourceType: 'module',
  plugins: babelPluginsWithoutJSX,
  allowReturnOutsideFunction: true,
  allowImportExportEverywhere: true,
} as ParserOptions
