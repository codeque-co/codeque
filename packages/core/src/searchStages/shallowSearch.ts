import { NotNullParsedQuery, SearchSettings } from '../types'
import { measureStart } from '../utils'

type ShallowSearchArgs = SearchSettings & {
  queries: NotNullParsedQuery[]
  fileContent: string
}

export const shallowSearch = ({
  queries,
  fileContent,
  ...settings
}: ShallowSearchArgs): boolean => {
  const {
    logger: { log },
    caseInsensitive,
  } = settings
  const measureShallowSearch = measureStart('shallowSearch')

  const fileContentForTokensLookup = caseInsensitive
    ? fileContent.toLocaleLowerCase()
    : fileContent

  const includesUniqueTokens = queries.some(({ uniqueTokens }) =>
    uniqueTokens.every((token) => fileContentForTokensLookup.includes(token)),
  )
  measureShallowSearch()

  return includesUniqueTokens
}
