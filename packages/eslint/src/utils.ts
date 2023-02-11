import { ParsedQuery } from '@codeque/core'

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
