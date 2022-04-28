import fs from 'fs'
import { SearchArgs, SearchResults } from '/search'

//TODO we temporarily escape $ as well to support wildcards
// Probably need some other wildcard pattern as dolar is used in template string
const nonIdentifierOrKeyword = /([^\w\s\$])/

// TODO either make all white spaces optional or which is more complex make whitespaces around punctuations optional

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
        if (
          nonIdentifierOrKeyword.test(subStr) ||
          [']', ')'].includes(subStr)
        ) {
          const escaped = '\\' + subStr.split('').join('\\')
          return escaped
        }
        return subStr
      })
      .join(isStringContent ? '' : '(\\s)*')
    if (!isStringContent) {
      result = result
        // .replace(/\s+/g, '(\\s)+') // whitespaces non optional
        .replace(/\s+/g, '(\\s)*') //whitespaces non optional

        .replace(/;/g, ';?')
    }

    result = result
      .replace(/\$\$/g, '([\\S\\s])+?') // changed - match anything for a wildcard, not only non-whitespace
      .replace(/\$/g, '([\\S\\s])*?')
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
      const fileContent = fs.readFileSync(filePath).toString()
      const matches = fileContent.match(query)
      const transformedMatches = (matches ?? []).map((match) => ({
        start: 0,
        end: 0,
        loc: {
          start: { line: 0, column: 0 },
          end: { line: 0, column: 0 }
        },
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
