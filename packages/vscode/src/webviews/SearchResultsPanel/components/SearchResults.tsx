import { Flex, Text, Link, Button } from '@chakra-ui/react'
import { SearchResults, Match } from '@codeque/core'
import { CodeBlock } from '../../components/CodeBlock'
import { darkTheme, lightTheme } from '../../components/codeHighlightThemes'
import { eventBusInstance } from '../../../EventBus'

type SearchResultsListProps = {
  matches: SearchResults['matches']
  getRelativePath: (filePath: string) => string | undefined
  displayLimit: number
  extendDisplayLimit: () => void
  showAllResults: () => void
}

const highlightColorOnLight = 'rgb(249,245,182)'
const highlightColorOnDark = '#366186'

const matchHighlightStyle = {
  backgroundColor: highlightColorOnDark,
  boxShadow: `0px 5px 0px ${highlightColorOnDark}, 0px -5px 0px ${highlightColorOnDark}`
}
import { useThemeType } from '../../components/useThemeType'

export function SearchResultsList({
  matches,
  getRelativePath,
  displayLimit,
  showAllResults,
  extendDisplayLimit
}: SearchResultsListProps) {
  const openFile = (data: { filePath: string; location: Match['loc'] }) => {
    eventBusInstance.dispatch('open-file', data)
  }

  const themeType = useThemeType()
  const highlightTheme = themeType === 'dark' ? darkTheme : lightTheme

  if (matches.length === 0) {
    return (
      <Flex
        width="100%"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Text>No results found</Text>
      </Flex>
    )
  }

  return (
    <Flex flexDir="column" mt="5" overflowY={'auto'}>
      {matches.slice(0, displayLimit).map((match) => {
        const matchHighlight = [{ ...match.loc, style: matchHighlightStyle }]

        return (
          <Flex
            key={`${match.filePath}-${match.start}-${match.end}`}
            flexDir="column"
            mb="4"
            border="1px solid"
            borderColor={
              themeType === 'dark'
                ? highlightTheme.plain.backgroundColor
                : 'blue.200'
            }
          >
            <Link
              p="2"
              onClick={() =>
                openFile({
                  filePath: match.filePath,
                  location: match.loc
                })
              }
              fontWeight="500"
            >
              <Text as="span">{getRelativePath(match.filePath)}</Text>
              <Text as="span">:</Text>
              <Text as="span" color="#c792ea">
                {match.loc.start.line}
              </Text>
              <Text as="span">:</Text>
              <Text as="span" color="#ffcb8b">
                {match.loc.start.column}
              </Text>
            </Link>
            <Flex
              padding="5"
              background={highlightTheme.plain.backgroundColor}
              overflowX="auto"
            >
              <CodeBlock
                startLineNumber={match.extendedCodeFrame?.startLine}
                theme={highlightTheme}
                // customHighlight={matchHighlight}
              >
                {match.extendedCodeFrame?.code as string}
              </CodeBlock>
            </Flex>
          </Flex>
        )
      })}
      {matches.length > displayLimit ? (
        <Flex justifyContent="center" ml="5" mr="5" mb="5">
          <Button onClick={extendDisplayLimit}>Show more</Button>
          <Button ml="5" onClick={showAllResults}>
            Show all ({matches.length})
          </Button>
        </Flex>
      ) : null}
    </Flex>
  )
}
