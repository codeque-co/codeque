//@ts-ignore
import { Mode, searchInStrings, __internal } from '@codeque/core/web'

import { useCallback, useEffect, useState } from 'react'
import { SearchFileType } from '../../../types'
import { isQueryRestricted } from '../../../restrictedQueries'
import { fileTypeToParserMap } from '../../../utils'

const getHostSystemFilesFetchBaseUrl = () => {
  const mainScriptSrc = document
    .getElementById('main-script')
    ?.getAttribute('src')

  if (mainScriptSrc) {
    return mainScriptSrc.split('/dist-webviews')[0]
  }
}

export type QueryParseError = {
  text: string
  location: {
    line: number
    column: number
  }
}

export type Hint = {
  text: string
  tokens: Array<{ content: string; type: string }>
}

export function useParseQueryError() {
  const [hostSystemFilesFetchBaseUrl, setHostSystemFilesFetchBaseUrl] =
    useState('')

  useEffect(() => {
    setHostSystemFilesFetchBaseUrl(getHostSystemFilesFetchBaseUrl() ?? '')
  }, [])

  const parseQuery = useCallback(
    async ({
      query,
      mode,
      fileType,
    }: {
      query: string
      mode: Mode
      fileType: SearchFileType
    }): Promise<{
      error: QueryParseError | null
      hint: Hint | null
    }> => {
      if (isQueryRestricted(query, fileType, mode)) {
        return {
          error: {
            text: 'Query restricted for performance reasons',
            location: { line: 0, column: 0 },
          },
          hint: null,
        }
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

            if (matches.errors.length > 0) {
              console.error(matches.errors)
              const error = matches.errors[0]

              // indicates query parse error
              if (typeof error === 'object' && 'queryNode' in error) {
                if (mode !== 'text' && hint) {
                  // Don't display error when there are hints available

                  return { error: null, hint }
                } else if (!error.error.text.includes('Empty query')) {
                  return {
                    error: {
                      text: error.error.text,
                      location: error.error.location,
                    },
                    hint,
                  }
                }
              } else {
                return {
                  error: {
                    text: error,
                    location: { line: 0, column: 0 },
                  },
                  hint,
                }
              }
            }

            return { error: null, hint }
          } catch (e) {
            console.error('Query parse error', e)

            return {
              error: {
                text: 'Unknown parse error',
                location: { line: 0, column: 0 },
              },
              hint: null,
            }
          }
        }

        return handleParse()
      }

      return { error: null, hint: null }
    },
    [hostSystemFilesFetchBaseUrl],
  )

  return parseQuery
}
