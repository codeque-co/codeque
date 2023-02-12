import { ParsedQuery, PoorNodeType } from '@codeque/core'
import { SearchFn } from './types'

export const formatQueryParseErrors = (queries: [ParsedQuery[], boolean][]) => {
  return `Queries parse errors: [\n${queries
    .map(([[{ error, queryCode }]]) => {
      const errorLocation = error?.location
        ? `(${error?.location?.line}:${error?.location?.column})`
        : ''

      return `"${queryCode}" -> ${error?.text}${errorLocation}`
    })
    .join(',\n')}\n]`
}

export const createMultipleSearchFunctionsExecutor =
  (searchFns: Array<SearchFn>) => (node: PoorNodeType) => {
    searchFns.forEach((searchFn) => searchFn(node))
  }

const typescriptEslintParser = '@typescript-eslint/parser' as const

type SupportedParsers = typeof typescriptEslintParser
export const supportedParsers = [typescriptEslintParser]

export const parserNamesMappingsToCodeQueInternal = {
  [typescriptEslintParser]: 'typescript-eslint',
} as const

export const extractParserNameFromResolvedPath = (pathToParser: string) => {
  const [_, pathAfterNodeModules] = pathToParser.split('node_modules')
  const separatorRegExp = /(\/|\\)/
  const pathSegments = pathAfterNodeModules
    .split(separatorRegExp)
    .filter((segment) => Boolean(segment) && !separatorRegExp.test(segment))
  const org = pathSegments[0].startsWith('@') ? pathSegments[0] : null
  const packageName = org !== null ? pathSegments[1] : pathSegments[0]

  if (org) {
    return `${org}/${packageName}`
  }

  return packageName
}

export const assertCompatibleParser = (parserPath: string) => {
  const parser = extractParserNameFromResolvedPath(parserPath)

  if (!supportedParsers.includes(parser as any)) {
    throw new Error(
      `\nCodeQue does not support "${parser}" parser.\nSupported parsers are:\n -${supportedParsers.join(
        '\n- ',
      )}\nPlease open an issue to request parser support.\nVisit https://github.com/codeque-co/codeque/issues\n`,
    )
  }

  return parser as SupportedParsers
}
