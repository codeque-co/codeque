import { Box, Flex, Text } from '@chakra-ui/react'
import { Editor } from '../../components/Editor'
//@ts-ignore
import { Mode } from '@codeque/core/web'

import { Fragment, useEffect, useState } from 'react'
import { codeRed } from '../../components/Highlight'
import { useThemeType } from '../../components/useThemeType'

import { SearchFileType, ReplaceMode } from '../../../types'
import { Hint, QueryParseError, useParseQueryError } from './useParseQuery'

type Props = {
  replacement: string
  setReplacement: (replacement: string) => void
  searchMode: Mode
  replaceMode: ReplaceMode
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

export function ReplacementEditor({
  replacement,
  setReplacement,
  setHasQueryError,
  searchMode,
  replaceMode,
  fileType,
}: Props) {
  const [replacementHint, setReplacementHint] = useState<Hint | null>(null)
  const [replacementError, setReplacementError] =
    useState<QueryParseError | null>(null)

  const isEditorFocusedDebounced = true

  useEffect(() => {
    setHasQueryError(Boolean(replacementError))
  }, [replacementError])

  const parseQuery = useParseQueryError()

  useEffect(() => {
    setReplacementError(null)
    setReplacementHint(null)

    if (replaceMode === 'merge-code') {
      parseQuery({
        mode: searchMode,
        query: replacement,
        fileType,
      }).then(({ error, hint }) => {
        if (error) {
          setReplacementError(error)
        }

        if (hint) {
          setReplacementHint(hint)
        }
      })
    }
  }, [searchMode, replacement, fileType, replaceMode])

  const replacementCustomHighlight = replacementError?.location
    ? [getParseErrorHighlight(replacementError.location)]
    : []

  const themeType = useThemeType()

  const isDarkTheme = themeType === 'dark'

  return (
    <Flex mt="4" width="50%" flexDirection="column">
      <Box position="relative" height="100%">
        <Editor
          code={replacement}
          setCode={setReplacement}
          theme={themeType}
          flex="1"
          customHighlight={replacementCustomHighlight}
          minHeight={isEditorFocusedDebounced ? '13vh' : '44px'}
          maxHeight={isEditorFocusedDebounced ? '35vh' : '44px'}
          height="100%"
          transition="0.1s max-height ease-in-out, 0.1s min-height ease-in-out"
          border="1px solid"
          borderColor={themeType === 'dark' ? 'transparent' : 'gray.300'}
          fileExtension={getHighlightFileExtension(fileType)}
          placeholder={'Replacement'}
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
        {replacementHint && (
          <Text as="span">
            <Text as="span" fontWeight="bold" color="blue.200">
              Hint:
            </Text>{' '}
            {renderHint(replacementHint)}
          </Text>
        )}
        {!replacementHint && replacementError && (
          <Text as="span">
            <Text as="span" fontWeight="bold" color="red">
              Parse error:
            </Text>
            <Text as="span" ml="2">
              {replacementError?.text}
            </Text>
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
