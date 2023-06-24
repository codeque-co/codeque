import { getExtendedCodeFrame, nonIdentifierOrKeyword } from './utils'
import {
  FileSystemSearchArgs,
  SearchResults,
  Matches,
  HardStopFlag,
} from './types'

const getMatchPosition = (match: string, fileContents: string) => {
  const start = fileContents.indexOf(match)
  const end = start + match.length

  const fileLines = fileContents.split(/\n/)
  const matchLines = match.split(/\n/)
  const firstMatchLine = matchLines[0]
  const lastMatchLine = matchLines[matchLines.length - 1]

  let charsToFirstLineCounter = 0

  const startLineIndex = fileLines.findIndex((line) => {
    const newLineCharLen = 1
    charsToFirstLineCounter += line.length + newLineCharLen

    return charsToFirstLineCounter > start
  })

  const endLineIndex = startLineIndex + matchLines.length - 1
  const startLineColumn = fileLines[startLineIndex].indexOf(firstMatchLine)
  const endLineColumn =
    fileLines[endLineIndex].indexOf(lastMatchLine) + lastMatchLine.length

  return {
    start,
    end,
    loc: {
      start: { line: startLineIndex + 1, column: startLineColumn },
      end: { line: endLineIndex + 1, column: endLineColumn },
    },
  }
}

type QueryWithShallowQuery = {
  regexpQuery: RegExp
  shallowQuery: string[]
}

const prepareQuery = (queryCode: string, caseInsensitive?: boolean) => {
  const regExpFlags = 'gm' + (caseInsensitive ? 'i' : '')

  if (queryCode.length === 0) {
    return null
  }

  const isWildcardRegExp = /\$\$\$?m?/g

  let parts = queryCode
    .split(/"/g)
    .map((part) => part.split(/'/g))
    .flat(1)

  parts = parts.map((part, idx) => {
    const isStringContent: boolean = idx % 2 === 1

    const zipParts = (parts: string[]) => {
      let result = ''

      for (let i = 0; i < parts.length; i++) {
        const currentPart = parts[i]
        const nextPart = parts[i + 1] ?? ''

        if (
          (currentPart.match(isWildcardRegExp) ?? []).length > 0 ||
          (nextPart.match(isWildcardRegExp) ?? []).length > 0 ||
          nextPart === ''
        ) {
          result += currentPart
        } else {
          result += `${currentPart}(\\s)*`
        }
      }

      return result
    }

    const partsOfPart = part
      .split(nonIdentifierOrKeyword)
      .filter((str) => str !== '')
      .map((subStr) => {
        const splitByWildcard3 = subStr.split(/(\$\$\$m?)/g)

        if (splitByWildcard3.length > 1) {
          return splitByWildcard3
        }

        return subStr
      })
      .flat(1)
      .map((subStr) => {
        const splitByWildcard2 = subStr.split(/(\$\$m?)/g)

        if (
          subStr !== '$$$' &&
          subStr !== '$$$m' &&
          splitByWildcard2.length > 1
        ) {
          return splitByWildcard2
        }

        return subStr
      })
      .flat(1)
      .map((subStr) => {
        const splitByWildcard1 = subStr.split(/(\$)/g)

        if (
          subStr !== '$$$' &&
          subStr !== '$$$m' &&
          subStr !== '$$' &&
          subStr !== '$$m' &&
          splitByWildcard1.length > 1
        ) {
          return splitByWildcard1
        }

        return subStr
      })
      .flat(1)
      .filter((str) => {
        if (!isStringContent) {
          return str.trim() !== ''
        }

        //we want to keep spaces inside strings
        return true
      })
      .map((subStr) => {
        if (nonIdentifierOrKeyword.test(subStr) || subStr === '$') {
          const escaped = '\\' + subStr.split('').join('\\')

          return escaped
        }

        return subStr
      })

    let result = isStringContent ? partsOfPart.join('') : zipParts(partsOfPart)

    if (!isStringContent) {
      result = result.replace(/\s+/g, '(\\s)*').replace(/;/g, ';?')
    }

    result = result
      .replace(/\$\$\$m/g, '([\\S\\s])+?')
      .replace(/\$\$m/g, '([\\S\\s])*?')
      .replace(/\$\$\$/g, '([\\S\\t ])+?')
      .replace(/\$\$/g, '([\\S\\t ])*?')

    return result
  })

  const query = new RegExp(
    parts.reduce((regexp, part, index) => {
      if (index % 2 === 1) {
        regexp += '(\\s)*'
      }

      regexp += `("|')`

      if (index % 2 === 0) {
        regexp += '(\\s)*'
      }

      regexp += part

      return regexp
    }),
    regExpFlags,
  )

  let shallowQuery = null
  const queryStartsWithWildcard = queryCode.startsWith('$$')
  const queryEndsWithWildcard =
    queryCode.endsWith('$$') || queryCode.endsWith('$$m')

  if (queryStartsWithWildcard || queryEndsWithWildcard) {
    const queryWithoutWildcards = queryCode.replace(isWildcardRegExp, ' ')
    shallowQuery = queryWithoutWildcards.match(/\w+/g)
  }

  return { regexpQuery: query, shallowQuery } as QueryWithShallowQuery
}

type TextSearchArgs = FileSystemSearchArgs & {
  getFileContent: (filePath: string) => string
  onPartialResult?: (matches: Matches) => void
  maxResultsLimit?: number
  hardStopFlag?: HardStopFlag
}

export function textSearch({
  queryCodes,
  filePaths,
  caseInsensitive,
  getFileContent,
  onPartialResult,
  maxResultsLimit,
  hardStopFlag,
}: TextSearchArgs): SearchResults {
  const queries = queryCodes
    .map((queryCode) => prepareQuery(queryCode, caseInsensitive))
    .filter((query) => Boolean(query?.regexpQuery)) as QueryWithShallowQuery[]

  if (queries.length === 0) {
    return {
      matches: [],
      hints: [],
      errors: ['Empty Query'],
    }
  }

  const searchErrors = []
  const allMatches = []

  for (const filePath of filePaths) {
    if (
      (maxResultsLimit !== undefined && allMatches.length > maxResultsLimit) ||
      hardStopFlag?.stopSearch
    ) {
      break
    }

    try {
      const fileContent = getFileContent(filePath)

      for (const query of queries) {
        if (
          query.shallowQuery === null ||
          query.shallowQuery.every((subShallowQuery) =>
            fileContent.includes(subShallowQuery),
          )
        ) {
          const matches = (fileContent.match(query.regexpQuery) ?? []).map(
            /**
             * Some matches contains white at start or end
             * We have get rid of them as they break further position calculation logic
             * They are not necessary, we cannot effectively highlight new line char
             * These chars are result of query preparation in some edge cases
             * It do not make sense to search for spaces, so we can remove it
             */
            (match) => match.trim(),
          )

          let contentToMatchPosition = fileContent

          const transformedMatches = matches.map((match) => {
            const matchPositionData = getMatchPosition(
              match,
              contentToMatchPosition,
            )

            // replace match in content to properly find the same match in the source file
            // For multiline matches we have to keep new line chars in order to properly determine lines for subsequent matches
            const matchGhost = match.replace(/\S/g, ' ') // replace any non-white space with a space char

            contentToMatchPosition = contentToMatchPosition.replace(
              match,
              matchGhost,
            )

            const [extendedCodeFrame, newStartLine] = getExtendedCodeFrame(
              matchPositionData,
              fileContent,
            )

            return {
              ...matchPositionData,
              code: match,
              extendedCodeFrame: {
                code: extendedCodeFrame,
                startLine: matchPositionData.loc.start.line + newStartLine,
              },
              query: query.toString(),
              filePath,
              // TODO: improve text search types, they do not provide aliases
              aliases: {
                identifierAliasesMap: {},
                nodesTreeAliasesMap: {},
                stringAliasesMap: {},
              },
            }
          })

          if (onPartialResult && transformedMatches.length > 0) {
            onPartialResult(transformedMatches)
          }

          allMatches.push(...transformedMatches)
        }
      }
    } catch (e) {
      searchErrors.push((e as Error).message)
    }
  }

  const result = { errors: searchErrors, matches: allMatches, hints: [] }

  return result
}
