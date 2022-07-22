import { Flex, Text } from '@chakra-ui/react'
import { Editor } from '../../components/Editor'
//@ts-ignore
import { Mode, searchInStrings } from '@codeque/core/web'

import { Fragment, useEffect, useState } from 'react'
import { codeRed } from '../../components/Highlight'
import { useThemeType } from '../../components/useThemeType'
type Error = {
  text: string
  location: {
    line: number
    column: number
  }
}

type Hint = {
  text: string
  tokens: Array<{ content: string; type: string }>
}

type Props = {
  query: string
  setQuery: (query: string) => void
  mode: Mode
}

const renderHint = (hint: Hint) => {
  return (
    <Text as="span">
      {hint.tokens.map(({ content, type }) =>
        type === 'code' ? (
          <Text as="pre" display="inline-block" key={content}>
            {content}
          </Text>
        ) : (
          <Fragment key={content}>{content}</Fragment>
        )
      )}
    </Text>
  )
}

const getParseErrorHighlight = (errorLocation: {
  line: number
  column: number
}) => {
  return {
    start: errorLocation,
    end: {
      line: errorLocation.line,
      column: errorLocation.column + 1
    },
    style: {
      borderBottom: `3px solid ${codeRed}`
    }
  }
}

export function QueryEditor({ query, setQuery, mode }: Props) {
  const [queryHint, setQueryHint] = useState<Hint | null>(null)
  const [queryError, setQueryError] = useState<Error | null>(null)

  useEffect(() => {
    setQueryError(null)
    setQueryHint(null)

    try {
      //@ts-ignore
      const matches = searchInStrings({
        queryCodes: [query],
        files: [
          {
            content: '',
            path: 'file.ts'
          }
        ],
        mode
      })
      const hint = matches.hints?.[0]?.[0] ?? null
      setQueryHint(hint)

      if (matches.errors.length > 0) {
        const error = matches.errors[0]

        // indicates query parse error
        if ('queryNode' in error) {
          if (mode !== 'text' && hint) {
            // Don't display error when there are hints available

            setQueryError(null)
          } else if (!error.error.text.includes('Empty query')) {
            setQueryError({
              text: error.error.text,
              location: error.error.location
            })
          }
        }
      }
    } catch (e) {
      console.log('search error', e)
    }
  }, [mode, query])

  const queryCustomHighlight = queryError?.location
    ? [getParseErrorHighlight(queryError.location)]
    : []

  const themeType = useThemeType()

  return (
    <Flex mt="5" width="100%" flexDirection="column">
      <Editor
        code={query}
        setCode={setQuery}
        theme={themeType}
        flex="1"
        minHeight="50px"
        customHighlight={queryCustomHighlight}
        maxH={'35vh'}
        border="1px solid"
        borderColor={themeType === 'dark' ? 'transparent' : 'blue.200'}
      />
      <Flex height="20px" alignItems="center" mt="2">
        {queryHint && (
          <Text as="span">
            <Text as="span" fontWeight="bold" color="blue.200">
              Hint:
            </Text>{' '}
            {renderHint(queryHint)}
          </Text>
        )}
        {!queryHint && queryError && (
          <Text as="span">
            <Text as="span" fontWeight="bold" color="red">
              Parse error:
            </Text>
            <Text as="span" ml="2">
              {queryError?.text}
            </Text>
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
