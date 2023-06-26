import { Box, Flex, Text } from '@chakra-ui/react'
import { Editor } from '../../components/Editor'
//@ts-ignore
import { Mode, searchInStrings } from '@codeque/core/web'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { codeRed } from '../../components/Highlight'
import { useThemeType } from '../../components/useThemeType'
import useDebounce, { parserNameMap } from '../../../utils'

import { SearchFileType } from '../../../StateManager'

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
  const [queryError, setQueryError] = useState<Error | null>(null)
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  const handleEditorFocus = useCallback(() => setIsEditorFocused(true), [])
  const handleEditorBlur = useCallback(() => setIsEditorFocused(false), [])

  const isEditorFocusedDebounced = useDebounce(isEditorFocused, 200)

  useEffect(() => {
    setHasQueryError(Boolean(queryError))
  }, [queryError])

  useEffect(() => {
    setQueryError(null)
    setQueryHint(null)

    try {
      const parser = parserNameMap[fileType]

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
      console.error('search error', e)
    }
  }, [mode, query])

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
          flex="1"
          customHighlight={queryCustomHighlight}
          minHeight={isEditorFocusedDebounced ? '13vh' : '44px'}
          maxHeight={isEditorFocusedDebounced ? '35vh' : '44px'}
          transition="0.1s max-height ease-in-out, 0.1s min-height ease-in-out"
          border="1px solid"
          borderColor={themeType === 'dark' ? 'transparent' : 'gray.300'}
          onEditorFocus={handleEditorFocus}
          onEditorBlur={handleEditorBlur}
          fileExtension={getHighlightFileExtension(fileType)}
        />
        {!isEditorFocusedDebounced && (
          <Box
            background={`linear-gradient(0deg, ${
              isDarkTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
            } 0%, transparent 100%)`}
            position="absolute"
            bottom="0px"
            width="100%"
            height="16px"
          />
        )}
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
