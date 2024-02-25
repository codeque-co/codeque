import { Box, Flex, Text } from '@chakra-ui/react'
import { Editor } from '../../components/Editor'
//@ts-ignore
import { Mode, searchInStrings, __internal } from '@codeque/core/web'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { fileTypeToParserMap } from '../../../utils'
import { codeRed } from '../../components/Highlight'
import { useThemeType } from '../../components/useThemeType'

import { isQueryRestricted } from '../../../restrictedQueries'
import { SearchFileType } from '../../../SearchStateManager'

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
  }

  return map[fileType]
}

const getHostSystemFilesFetchBaseUrl = () => {
  const mainScriptSrc = document
    .getElementById('main-script')
    ?.getAttribute('src')

  if (mainScriptSrc) {
    return mainScriptSrc.split('/dist-webviews')[0]
  }
}

export function QueryEditor({
  query,
  setQuery,
  setHasQueryError,
  mode,
  fileType,
}: Props) {
  const [queryHint, setQueryHint] = useState<Hint | null>(null)
  const [queryError, setQueryError] = useState<Error | null>(null)
  const [hostSystemFilesFetchBaseUrl, setHostSystemFilesFetchBaseUrl] =
    useState('')

  useEffect(() => {
    setHostSystemFilesFetchBaseUrl(getHostSystemFilesFetchBaseUrl() ?? '')
  }, [])

  useEffect(() => {
    setHasQueryError(Boolean(queryError))
  }, [queryError])

  useEffect(() => {
    setQueryError(null)
    setQueryHint(null)

    if (isQueryRestricted(query, fileType, mode)) {
      setQueryError({
        text: 'Query restricted for performance reasons',
        location: { line: 0, column: 0 },
      })
      // Do not init parser until hostSystemFilesFetchBaseUrl is determined
    } else if (hostSystemFilesFetchBaseUrl) {
      const handleParse = async () => {
        try {
          const parser = fileTypeToParserMap[fileType]

          await __internal.parserSettingsMap[parser]().init?.(
            hostSystemFilesFetchBaseUrl,
          )

          const matches = searchInStrings({
            queryCodes: [query],
            files: [
              {
                content: '',
                path: 'file.ts',
              },
            ],
            mode,
            parser,
          })

          const hint = matches.hints?.[0]?.[0] ?? null
          setQueryHint(hint)

          if (matches.errors.length > 0) {
            console.error(matches.errors)
            const error = matches.errors[0]

            // indicates query parse error
            if (typeof error === 'object' && 'queryNode' in error) {
              if (mode !== 'text' && hint) {
                // Don't display error when there are hints available

                setQueryError(null)
              } else if (!error.error.text.includes('Empty query')) {
                setQueryError({
                  text: error.error.text,
                  location: error.error.location,
                })
              }
            } else {
              setQueryError({
                text: error,
                location: { line: 0, column: 0 },
              })
            }
          }
        } catch (e) {
          console.error('Query parse error', e)
        }
      }

      handleParse()
    }
  }, [mode, query, fileType, hostSystemFilesFetchBaseUrl])

  const queryCustomHighlight = queryError?.location
    ? [getParseErrorHighlight(queryError.location)]
    : []

  const themeType = useThemeType()

  const isDarkTheme = themeType === 'dark'

  return (
    <Flex mt="4" width="100%" flexDirection="column">
      <Box position="relative">
        <Editor
          code={query}
          setCode={setQuery}
          theme={themeType}
          customHighlight={queryCustomHighlight}
          flex="1"
          minHeight="13vh"
          maxHeight="30vh"
          transition="0.1s max-height ease-in-out, 0.1s min-height ease-in-out"
          border="1px solid"
          borderColor={isDarkTheme ? 'transparent' : 'gray.300'}
          fileExtension={getHighlightFileExtension(fileType)}
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
