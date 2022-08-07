import { Button, Flex, Text } from '@chakra-ui/react'
type ResultsMetaProps = {
  time: number | undefined
  filesCount: number | undefined
  matchesCount: number | undefined
  matchedFilesCount: number | undefined
  startSearch: () => void
}
export function ResultsMeta({
  time,
  filesCount,
  matchesCount,
  matchedFilesCount,
  startSearch,
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
        onClick={startSearch}
        size="sm"
        width="100px"
        marginLeft="auto"
        colorScheme="blue"
      >
        Search!
      </Button>
    </Flex>
  )
}
