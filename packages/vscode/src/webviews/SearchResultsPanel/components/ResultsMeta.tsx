import {
  Button,
  Flex,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  useTheme,
} from '@chakra-ui/react'
import { SearchInFileError, SearchResults } from '@codeque/core'
import { IoMdInformationCircleOutline } from 'react-icons/io'
import { useThemeType } from '../../components/useThemeType'
import { darkTheme, lightTheme } from '../../components/codeHighlightThemes'
import { openFile } from '../utils'
//@ts-ignore
import { Mode } from '@codeque/core/web'
import { ReplaceType, SearchFileType } from '../../../types'
import { ButtonWithOptionSelect } from '../../components/ButtonWithOptionSelect'
import { useState } from 'react'
import { zIndices } from '../../components/zIndices'

type ResultsMetaProps = {
  time: number | string | undefined
  filesCount: number | string | undefined
  matchesCount: number | string | undefined
  matchedFilesCount: number | string | undefined
  errors: SearchResults['errors'] | undefined
  startSearch: (useSelectionIfAvailable: boolean) => void
  startReplace: () => void
  setReplaceType: (replaceType: ReplaceType) => void
  searchInProgress: boolean
  replaceInProgress: boolean
  stopSearchOrReplace: () => void
  getRelativePath: (filePath: string) => string | undefined
  mode: Mode
  fileType: SearchFileType
  replaceType: ReplaceType
}

const noValue = 'n/a'

const extractLocationFormErrorText = (errorText: string) => {
  const matcher = /\((\d)+(,|:|;)(\d)+\)/g

  const locationStringMatch = errorText.match(matcher)

  if (locationStringMatch?.[0]) {
    const locationString = locationStringMatch[0]

    const [line, column] = locationString
      .replace('(', '')
      .replace(')', '')
      .split(/,|:|;/)
      .map((v) => parseInt(v.trim(), 10))

    return {
      start: { line, column },
      end: { line, column },
    }
  }

  return { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } }
}

export function ResultsMeta({
  time = noValue,
  filesCount = noValue,
  matchesCount = noValue,
  matchedFilesCount = noValue,
  errors,
  startSearch,
  searchInProgress,
  stopSearchOrReplace,
  getRelativePath,
  startReplace,
  replaceInProgress,
  replaceType,
  setReplaceType,
}: ResultsMetaProps) {
  const errorsToDisplay: Array<string | SearchInFileError> =
    (errors?.filter(
      (error) => typeof error === 'string' || 'filePath' in error,
    ) as Array<string | SearchInFileError>) ?? []

  const theme = useTheme()
  const themeType = useThemeType()
  const highlightTheme = themeType === 'dark' ? darkTheme : lightTheme

  const chakraThemeAccessorProperty = themeType === 'dark' ? '_dark' : '_light'
  const popoverBackground = 'var(--vscode-editor-background)'
  const errorBackground = highlightTheme.plain.backgroundColor

  const popoverBorderColor =
    theme.semanticTokens.colors['chakra-border-color'][
      chakraThemeAccessorProperty
    ]

  return (
    <Flex mb="2" alignItems="center">
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
      {errorsToDisplay !== undefined && errorsToDisplay.length > 0 && (
        <Popover>
          <PopoverTrigger>
            <Flex ml="5" color="red.500" cursor="pointer" alignItems="center">
              <Text mr="2">
                Search or Replace failed for <b>{errorsToDisplay.length}</b>{' '}
                file(s)
              </Text>
              <IoMdInformationCircleOutline />
            </Flex>
          </PopoverTrigger>

          <PopoverContent
            maxWidth="80vw"
            width="auto"
            backgroundColor={popoverBackground}
            borderColor={popoverBorderColor}
          >
            <PopoverCloseButton />
            <PopoverHeader borderColor={popoverBorderColor}>
              Search Errors
            </PopoverHeader>
            <PopoverBody borderColor={popoverBorderColor}>
              <Flex maxHeight="70vh" overflowY="auto" flexDirection="column">
                {errorsToDisplay.map((error, idx) => {
                  const relativePath = getRelativePath(
                    (error as SearchInFileError)?.filePath,
                  )

                  return (
                    <Flex
                      key={idx}
                      flexDir="column"
                      mb="3"
                      border="1px solid"
                      borderColor={popoverBorderColor}
                    >
                      {typeof error === 'string' ? (
                        <Text p={2} backgroundColor={errorBackground}>
                          {error}
                        </Text>
                      ) : (
                        <>
                          <Text
                            fontWeight={600}
                            borderBottom="1px solid"
                            borderColor={popoverBorderColor}
                            p={2}
                            onClick={() => {
                              const location = extractLocationFormErrorText(
                                error.error,
                              )

                              openFile({
                                filePath: error.filePath,
                                locationsToSelect: [location],
                              })
                            }}
                            cursor="pointer"
                            _hover={{
                              textDecor: 'underline',
                            }}
                          >
                            {relativePath}
                          </Text>
                          <Text p={2} backgroundColor={errorBackground}>
                            {(error as SearchInFileError)?.error}
                          </Text>
                        </>
                      )}
                    </Flex>
                  )
                })}
              </Flex>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}

      <Button
        onClick={() => {
          if (searchInProgress) {
            stopSearchOrReplace()
          } else {
            startSearch(true)
          }
        }}
        size="sm"
        width="100px"
        marginLeft="auto"
        colorScheme="blue"
        isLoading={searchInProgress}
        loadingText="Stop"
        // isLoading disables button by default
        disabled={replaceInProgress}
      >
        Search!
      </Button>
      <Flex
        marginLeft="10px"
        minWidth="100px"
        zIndex={zIndices.replaceButtonMenu}
      >
        <ButtonWithOptionSelect
          size="sm"
          colorScheme="purple"
          isLoading={replaceInProgress}
          loadingText="Stop"
          // isLoading disables button by default
          disabled={searchInProgress}
          selectedOptionValue={replaceType}
          onClick={() => {
            if (replaceInProgress) {
              stopSearchOrReplace()
            } else {
              startReplace()
            }
          }}
          onOptionSelect={setReplaceType}
          options={[
            {
              label: 'Replace',
              value: 'replace',
            },
            {
              label: 'Quick Replace ⚡',
              value: 'quick-replace',
            },
          ]}
        />
      </Flex>
    </Flex>
  )
}
