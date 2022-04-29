import fs from 'fs'
import { SearchArgs, SearchResults } from '/search'

//TODO we temporarily escape $ as well to support wildcards
// Probably need some other wildcard pattern as dolar is used in template string
const nonIdentifierOrKeyword = /([^\w\s\$])/

// TODO either make all white spaces optional or which is more complex make whitespaces around punctuations optional
// TODO think of restricting search to match within a block of code where search started
// TODO if there is a wildcard in query eg. 'const $ = a', we can search two times, second time from the end of file with reversed file and query
// so we can try having smaller matches (example looking for <Checkbox colorScheme="red" and finding  <CheckboxGroup><Checkbox colorScheme="red")
// maybe we could somehow compare these two matches and take smaller one

// TODO remove all from file comments before making search
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
        console.log('splitByWildcard3', splitByWildcard3)
        if (splitByWildcard3.length > 1) {
          return splitByWildcard3
        }
        return subStr
      })
      .flat(1)
      .map((subStr) => {
        const splitByWildcard2 = subStr.split(/(\$\$)/g)
        console.log('splitByWildcard2', splitByWildcard2)
        if (subStr !== '$$$' && splitByWildcard2.length > 1) {
          return splitByWildcard2
        }
        return subStr
      })
      .flat(1)
      .map((subStr) => {
        const splitByWildcard1 = subStr.split(/(\$)/g)
        console.log('splitByWildcard1', splitByWildcard1)
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
        console.log('subStr', `'${subStr}'`)
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
      // .replace(/\$\$\$/g, '([\\S\\s])+?') // changed - match anything for a wildcard, not only non-whitespace
      // .replace(/\$\$/g, '([\\S\\s])*?')

      // better perf but wildcard cannot have whitespaces around in some cases
      // .replace(/\$\$\$/g, '([\\S])+?')
      // .replace(/\$\$/g, '([\\S])*?')

      // wildcard can have whitespaces around but it's not matching whole file
      .replace(/\$\$\$/g, '(\\s)*([\\S])+?(\\s)*')
      .replace(/\$\$/g, '(\\s)*([\\S])*?(\\s)*')
    return result
  })

  const query = new RegExp(
    parts.join(`("|')`),
    'gm' + (caseInsensitive ? 'i' : '')
  )
  console.log('query', query)
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
