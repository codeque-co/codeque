import { Box, Flex, Text } from '@chakra-ui/react'
import { Editor } from '../../components/Editor'
//@ts-ignore
import { Mode } from '@codeque/core/web'

import { Fragment, useEffect, useState } from 'react'
import { codeRed } from '../../components/Highlight'
import { useThemeType } from '../../components/useThemeType'

import { SearchFileType } from '../../../types'
import { Hint, QueryParseError, useParseQueryError } from './useParseQuery'

type Props = {
  query: string
  setQuery: (query: string) => void
  mode: Mode
  setHasQueryError: (value: boolean) => void
  fileType: SearchFileType
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
        ),
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
      column: errorLocation.column + 1,
    },
    style: {
      borderBottom: `3px solid ${codeRed}`,
    },
  }
}

const getHighlightFileExtension = (fileType: SearchFileType) => {
  const map: Record<SearchFileType, string> = {
    all: 'tsx',
    html: 'html',
    'js-ts-json': 'tsx',
    css: 'css',
    python: 'py',
    lua: 'lua',
    csharp: 'csharp',
  }

  return map[fileType]
}

export function QueryEditor({
  query,
  setQuery,
  setHasQueryError,
  mode,
  fileType,
}: Props) {
  const [queryHint, setQueryHint] = useState<Hint | null>(null)
  const [queryError, setQueryError] = useState<QueryParseError | null>(null)

  useEffect(() => {
    setHasQueryError(Boolean(queryError))
  }, [queryError])

  const parseQuery = useParseQueryError()

  useEffect(() => {
    setQueryError(null)
    setQueryHint(null)

    parseQuery({
      mode,
      query,
      fileType,
    }).then(({ error, hint }) => {
      if (error) {
        setQueryError(error)
      }

      if (hint) {
        setQueryHint(hint)
      }
    })
  }, [mode, query, fileType])

  const queryCustomHighlight = queryError?.location
    ? [getParseErrorHighlight(queryError.location)]
    : []

  const themeType = useThemeType()

  const isDarkTheme = themeType === 'dark'

  return (
    <Flex mt="4" width="50%" flexDirection="column">
      <Box position="relative" height="100%">
        <Editor
          code={query}
          setCode={setQuery}
          theme={themeType}
          customHighlight={queryCustomHighlight}
          flex="1"
          minHeight="13vh"
          maxHeight="30vh"
          height="100%"
          transition="0.1s max-height ease-in-out, 0.1s min-height ease-in-out"
          border="1px solid"
          borderColor={isDarkTheme ? 'transparent' : 'gray.300'}
          fileExtension={getHighlightFileExtension(fileType)}
          placeholder="Query"
        />
      </Box>
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
