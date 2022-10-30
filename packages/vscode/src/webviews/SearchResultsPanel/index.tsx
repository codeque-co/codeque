//@ts-ignore
window.Buffer = global.Buffer = {}
//@ts-ignore
window.require = global.require = () => void 0

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Providers } from '../components/Providers'
import { QueryEditor } from './components/QueryEditor'
import { StateShape } from '../../StateManager'
import { SearchResultsList } from './components/SearchResults'
import { Flex, Spinner } from '@chakra-ui/react'
import { ResultsMeta } from './components/ResultsMeta'
import { ExtendedSearchResults } from 'types'
import { eventBusInstance } from '../../EventBus'
import { simpleDebounce } from '../../utils'
import { Matches } from '@codeque/core'

//@ts-ignore - Add typings
const vscode = acquireVsCodeApi()
//@ts-ignore - Add typings
window.vscode = vscode

type ResultsObj = {
  results: ExtendedSearchResults
  time: number
  files: string[]
}
const defaultDisplayLimit = 50

const Panel = () => {
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string | null>(
    null,
  )
  const [query, setQuery] = useState<string | null>(null)
  const [nextSearchIsFromSelection, setNextSearchIsFromSelection] =
    useState<boolean>(false)

  const [mode, setMode] = useState<string | null>(null)
  const [hasQueryError, setHasQueryError] = useState<boolean>(false)
  const [initialSettingsReceived, setInitialSettingsReceived] =
    useState<boolean>(false)
  const [results, setResults] = useState<ExtendedSearchResults | undefined>(
    undefined,
  )
  const [time, setTime] = useState<number | undefined>(undefined)
  const [filesList, setFilesList] = useState<string[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(50)
  const selectedText = useRef<string | null>(null)

  const handleSettingsChanged = useCallback((data: Partial<StateShape>) => {
    if (data.mode !== undefined) {
      setMode(data.mode)
    }
  }, [])

  const handleInitialSettings = useCallback((data: StateShape) => {
    setInitialSettingsReceived(true)

    if (data.query !== undefined) {
      setLastSearchedQuery(data.query) // to block first auto search
      setQuery(data.query)
    }

    handleSettingsChanged(data)
  }, [])

  const handleResults = useCallback((data: ResultsObj) => {
    setResults(data.results)
    setTime(data.time)
    setFilesList(data.files)
    setIsLoading(false)
    setDisplayLimit(defaultDisplayLimit)
    setNextSearchIsFromSelection(false)
  }, [])

  const handlePartialResults = useCallback((data: ResultsObj) => {
    setResults((partialResults) => ({
      matches: [...(partialResults?.matches ?? []), ...data.results.matches],
      relativePathsMap: {
        ...partialResults?.relativePathsMap,
        ...data.results.relativePathsMap,
      },
      groupedMatches: {},
      hints: [],
      errors: [],
    }))

    setFilesList((partialFilesList) => [
      ...(partialFilesList ?? []),
      ...data.files,
    ])

    setTime(data.time)
    setDisplayLimit(defaultDisplayLimit)
  }, [])

  const handleSearchStart = useCallback((query: string) => {
    setIsLoading(true)
    setResults(undefined)
    setFilesList([])
    setLastSearchedQuery(query)
  }, [])

  const startSearch = useCallback(
    (useSelectionIfAvailable = false) => {
      if (selectedText.current && useSelectionIfAvailable) {
        eventBusInstance.dispatch('set-settings', {
          query: selectedText.current,
        })
      }

      eventBusInstance.dispatch('start-search')
    },
    [selectedText],
  )

  const handleQueryChangeDebounced = useMemo(
    () =>
      simpleDebounce((query: string, hasQueryError: boolean) => {
        eventBusInstance.dispatch('set-query-in-settings', query)

        if (!hasQueryError) {
          startSearch()
        }
      }, 800),
    [startSearch],
  )

  useEffect(() => {
    eventBusInstance.env = 'search-results'
    window.addEventListener('message', eventBusInstance.pipeFromWindowMessage)
    const postMessage = (...args: any[]) => vscode.postMessage(...args)
    eventBusInstance.addTransport(postMessage)

    eventBusInstance.dispatch('results-panel-opened')

    return () => {
      eventBusInstance.removeTransport(postMessage)

      window.removeEventListener(
        'message',
        eventBusInstance.pipeFromWindowMessage,
      )
    }
  }, [])

  useEffect(() => {
    eventBusInstance.addListener('settings-changed', handleSettingsChanged)
    eventBusInstance.addListener('initial-settings', handleInitialSettings)

    return () => {
      eventBusInstance.removeListener('settings-changed', handleSettingsChanged)
      eventBusInstance.removeListener('initial-settings', handleInitialSettings)
    }
  }, [handleSettingsChanged])

  useEffect(() => {
    eventBusInstance.addListener('have-results', handleResults)

    return () => {
      eventBusInstance.removeListener('have-results', handleResults)
    }
  }, [handleResults])

  useEffect(() => {
    eventBusInstance.addListener('have-partial-results', handlePartialResults)

    return () => {
      eventBusInstance.removeListener(
        'have-partial-results',
        handlePartialResults,
      )
    }
  }, [handlePartialResults])

  useEffect(() => {
    const setNextSearchFromSelection = () => {
      setNextSearchIsFromSelection(true)
    }

    eventBusInstance.addListener(
      'open-search-from-selection',
      setNextSearchFromSelection,
    )

    return () => {
      eventBusInstance.removeListener(
        'open-search-from-selection',
        setNextSearchFromSelection,
      )
    }
  }, [setNextSearchIsFromSelection])

  useEffect(() => {
    eventBusInstance.addListener('search-started', handleSearchStart)

    return () => {
      eventBusInstance.removeListener('search-started', handleSearchStart)
    }
  }, [handleSearchStart])

  useEffect(() => {
    eventBusInstance.addListener('set-query-on-ui', setQuery)

    return () => {
      eventBusInstance.removeListener('set-query-on-ui', setQuery)
    }
  }, [setQuery])

  const matchedFilesCount = results
    ? Object.keys(results?.groupedMatches ?? {}).length
    : undefined

  const getRelativePath = (filePath: string) =>
    results?.relativePathsMap[filePath]

  const extendDisplayLimit = useCallback(() => {
    setDisplayLimit((currentLimit) => currentLimit + defaultDisplayLimit)
  }, [])

  const showAllResults = useCallback(() => {
    setDisplayLimit(results?.matches.length ?? 0)
  }, [results])

  useEffect(() => {
    if (
      initialSettingsReceived &&
      query !== null &&
      lastSearchedQuery !== query &&
      !nextSearchIsFromSelection
    ) {
      handleQueryChangeDebounced(query, hasQueryError)
    }
  }, [lastSearchedQuery, query, hasQueryError, nextSearchIsFromSelection])

  useEffect(() => {
    const handleSelectionChangeDebounced = simpleDebounce(() => {
      let text = window?.getSelection()?.toString() ?? null

      // Remove line numbers (unfortunately) selected from search result
      if (text !== null) {
        const lines = text.split(/\n/)
        text = lines.map((line) => line.replace(/^(\d)+/, '')).join('\n')
      }

      if (text !== selectedText.current) {
        selectedText.current = text

        eventBusInstance.dispatch('set-settings', {
          webviewTextSelection: text,
        })
      }
    }, 300)

    document.addEventListener('selectionchange', handleSelectionChangeDebounced)

    // For some reason selectionchange event is not fired if we remove selected text using `backspace`, `delete`, `ctrl+x`
    document.addEventListener('keyup', handleSelectionChangeDebounced)

    return () => {
      document.removeEventListener(
        'selectionchange',
        handleSelectionChangeDebounced,
      )

      document.removeEventListener('keypress', handleSelectionChangeDebounced)
    }
  }, [])

  const removeMatch = useCallback(
    (filePath: string, start: number, end: number) => {
      const currentMatches = results?.matches ?? ([] as Matches)
      const newMatches = currentMatches.filter(
        (match) =>
          !(
            match.filePath === filePath &&
            match.start === start &&
            match.end === end
          ),
      )

      setResults({
        ...results,
        matches: newMatches,
      } as ExtendedSearchResults)
    },
    [results],
  )

  const stopSearch = useCallback(() => {
    eventBusInstance.dispatch('stop-search')
  }, [])

  return (
    <Providers>
      <Flex height="98vh" flexDir="column">
        {query !== null ? (
          <QueryEditor
            query={query}
            setQuery={setQuery}
            mode={mode}
            setHasQueryError={setHasQueryError}
          />
        ) : null}
        <ResultsMeta
          time={time}
          startSearch={startSearch}
          filesCount={filesList?.length}
          matchesCount={results?.matches?.length}
          errors={results?.errors}
          matchedFilesCount={matchedFilesCount}
          searchInProgress={isLoading}
          stopSearch={stopSearch}
          getRelativePath={getRelativePath}
        />

        <SearchResultsList
          isLoading={isLoading}
          matches={results?.matches ?? []}
          getRelativePath={getRelativePath}
          displayLimit={displayLimit}
          extendDisplayLimit={extendDisplayLimit}
          showAllResults={showAllResults}
          removeMatch={removeMatch}
        />
      </Flex>
    </Providers>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<Panel />)
