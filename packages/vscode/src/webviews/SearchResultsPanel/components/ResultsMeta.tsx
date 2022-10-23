import { Button, Flex, Text } from '@chakra-ui/react'
import { SearchResults } from '@codeque/core'
type ResultsMetaProps = {
  time: number | string | undefined
  filesCount: number | string | undefined
  matchesCount: number | string | undefined
  matchedFilesCount: number | string | undefined
  errors: SearchResults['errors'] | undefined
  startSearch: (useSelectionIfAvailable: boolean) => void
  searchInProgress: boolean
  stopSearch: () => void
}

const noValue = 'n/a'

export function ResultsMeta({
  time = noValue,
  filesCount = noValue,
  matchesCount = noValue,
  matchedFilesCount = noValue,
  errors,
  startSearch,
  searchInProgress,
  stopSearch,
}: ResultsMetaProps) {
  return (
    <Flex mb="4" alignItems="center">
      {matchesCount !== undefined && (
        <Text>
          Total count: <b>{matchesCount}</b>
        </Text>
      )}
      {matchedFilesCount !== undefined && (
        <Text ml="5">
          Found in <b>{matchedFilesCount}</b> file(s)
        </Text>
      )}
      {time !== undefined && (
        <Text ml="5">
          Found in: <b>{time}s</b>
        </Text>
      )}
      {filesCount !== undefined && (
        <Text ml="5">
          Searched file(s): <b>{filesCount}</b>
        </Text>
      )}
      {errors !== undefined && errors.length > 0 && (
        <Text ml="5" color="red.500">
          Search failed for <b>{errors.length}</b> file(s)
        </Text>
      )}

      <Button
        onClick={() => {
          if (searchInProgress) {
            stopSearch()
          } else {
            startSearch(true)
          }
        }}
        size="sm"
        width="100px"
        marginLeft="auto"
        colorScheme="blue"
      >
        {searchInProgress ? 'Stop' : 'Search!'}
      </Button>
    </Flex>
  )
}
