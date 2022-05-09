import fs, { promises as fsPromise } from 'fs'
import { SearchArgs, SearchResults } from '/search'

const nonIdentifierOrKeyword = /([^\w\s\$])/

// TODO remove all from file comments before making search

// TODO need to rethink wildcards to optimize performance vs flexibility and ease of use, maybe more wildcard types
// TODO performance in to that bad unless you search for some multiline patters with wildcards
// We could have multiline wildcards and single line wildcards, eg see results of `colorScheme="$$sap$$"` or on$$$={() => $$$}
// So we can have wildcards `$$`, `$$$` for single line, `$$m` `$$$m` for two lines
// Think of unifying wildcards `$` count for all search modes

const singleLineCommentRegExp = /\/\/([\s\S])+?\n/g
const multiLineCommentRegExp = /\/\*([\s\S])+?\*\//g

const getMatchPosition = (match: string, fileContents: string) => {
  const start = fileContents.indexOf(match)
  const end = start + match.length

  const fileLines = fileContents.split(/\n/)
  const matchLines = match.split(/\n/)

  const firstMatchLine = matchLines[0]
  const lastMatchLine = matchLines[matchLines.length - 1]

  const startLineIndex = fileLines.findIndex((line) =>
    line.includes(firstMatchLine)
  )

  const endLineIndex = startLineIndex + matchLines.length - 1

  const startLineColumn = fileLines[startLineIndex].indexOf(firstMatchLine)
  const endLineColumn =
    fileLines[endLineIndex].indexOf(lastMatchLine) + lastMatchLine.length

  return {
    start,
    end,
    loc: {
      start: { line: startLineIndex + 1, column: startLineColumn },
      end: { line: endLineIndex + 1, column: endLineColumn }
    }
  }
}

export function textSearch({
  queryCodes,
  filePaths,
  caseInsensitive
}: SearchArgs): SearchResults {
  let parts = queryCodes[0]
    .split(/"/g)
    .map((part) => part.split(/'/g))
    .flat(1)

  parts = parts.map((part, idx) => {
    const isStringContent = idx % 2 === 1
    let result = part
      .split(nonIdentifierOrKeyword)
      .filter((str) => str !== '')
      .map((subStr) => {
        const splitByWildcard3 = subStr.split(/(\$\$\$)/g)
        if (splitByWildcard3.length > 1) {
          return splitByWildcard3
        }
        return subStr
      })
      .flat(1)
      .map((subStr) => {
        const splitByWildcard2 = subStr.split(/(\$\$)/g)
        if (subStr !== '$$$' && splitByWildcard2.length > 1) {
          return splitByWildcard2
        }
        return subStr
      })
      .flat(1)
      .map((subStr) => {
        const splitByWildcard1 = subStr.split(/(\$)/g)
        if (
          subStr !== '$$$' &&
          subStr !== '$$' &&
          splitByWildcard1.length > 1
        ) {
          return splitByWildcard1
        }
        return subStr
      })
      .flat(1)
      .filter((str) => str.trim() !== '')
      .map((subStr) => {
        if (nonIdentifierOrKeyword.test(subStr) || subStr === '$') {
          const escaped = '\\' + subStr.split('').join('\\')
          return escaped
        }
        return subStr
      })
      .join(isStringContent ? '' : '(\\s)*')
    if (!isStringContent) {
      result = result
        // .replace(/\s+/g, '(\\s)+') // whitespaces non optional
        .replace(/\s+/g, '(\\s)*') //whitespaces optional

        .replace(/;/g, ';?')
    }

    result = result
      // very slow perf as it try to match too much
      .replace(/\$\$\$/g, '([\\S\\s])+?') // changed - match anything for a wildcard, not only non-whitespace
      .replace(/\$\$/g, '([\\S\\s])*?')

    // better perf but wildcard cannot have whitespaces around in some cases
    // .replace(/\$\$\$/g, '([\\S])+?')
    // .replace(/\$\$/g, '([\\S])*?')

    // wildcard can have whitespaces around but it's not matching whole file
    // Not working well, it's not matching whitespaces between non-whitespaces
    // so option with very slow perf is more accurate
    // .replace(/\$\$\$/g, '(\\s)*([\\S])+?(\\s)*')
    // .replace(/\$\$/g, '(\\s)*([\\S])*?(\\s)*')
    return result
  })

  const query = new RegExp(
    parts.join(`("|')`),
    'gm' + (caseInsensitive ? 'i' : '')
  )
  const searchErrors = []
  const allMatches = []
  for (const filePath of filePaths) {
    try {
      // sync file getting works faster :man-shrug;
      const fileContent = fs.readFileSync(filePath).toString()
      const fileContentWithoutComments = fileContent
        .replace(singleLineCommentRegExp, '')
        .replace(multiLineCommentRegExp, '')

      const matches = fileContentWithoutComments.match(query) ?? []
      const transformedMatches = matches.map((match) => ({
        ...getMatchPosition(match, fileContent),
        code: match,
        query: query.toString(),
        filePath
      }))
      allMatches.push(...transformedMatches)
    } catch (e) {
      searchErrors.push(e)
      console.error(filePath, e)
    }
  }
  const result = { errors: searchErrors, matches: allMatches }
  return result
}
