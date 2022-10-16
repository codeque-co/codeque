import { Button, Flex, Text } from '@chakra-ui/react'
type ResultsMetaProps = {
  time: number | string | undefined
  filesCount: number | string | undefined
  matchesCount: number | string | undefined
  matchedFilesCount: number | string | undefined
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
          Found in <b>{matchedFilesCount}</b> files
        </Text>
      )}
      {time !== undefined && (
        <Text ml="5">
          Found in: <b>{time}s</b>
        </Text>
      )}
      {filesCount !== undefined && (
        <Text ml="5">
          Searched files: <b>{filesCount}</b>
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
