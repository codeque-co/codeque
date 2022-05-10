import fs from 'fs'
import { SearchArgs, SearchResults } from '/search'

// We process '$' separately
const nonIdentifierOrKeyword = /([^\w\s$])/

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
    parts.join(`("|')`),
    'gm' + (caseInsensitive ? 'i' : '')
  )

  const searchErrors = []
  const allMatches = []
  for (const filePath of filePaths) {
    try {
      // sync file getting works faster :man-shrug;
      const fileContent = fs.readFileSync(filePath).toString()

      const matches = fileContent.match(query) ?? []
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
