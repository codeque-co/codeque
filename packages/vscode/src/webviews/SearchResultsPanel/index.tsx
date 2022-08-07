//@ts-ignore
window.Buffer = global.Buffer = {}
//@ts-ignore
window.require = global.require = () => void 0

import { useEffect, useState, useCallback, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { Providers } from '../components/Providers'
import { QueryEditor } from './components/QueryEditor'
import { StateShape } from '../../StateManager'
import { SearchResultsList } from './components/SearchResults'
import { Flex, Spinner } from '@chakra-ui/react'
import { ResultsMeta } from './components/ResultsMeta'
import { ExtendedSearchResults } from 'types'
import { eventBusInstance } from '../../EventBus'
import { simpleDebounce } from '../utils'

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

  const handleSettingsChanged = useCallback((data: StateShape) => {
    setLastSearchedQuery(data.query) // to block first auto search
    setQuery(data.query)
    setMode(data.mode)
  }, [])

  const handleInitialSettings = useCallback((data: StateShape) => {
    setInitialSettingsReceived(true)
    setLastSearchedQuery(data.query) // to block first auto search
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

  const handleSearchStart = useCallback(() => {
    setIsLoading(true)
  }, [])

  const startSearch = useCallback(() => {
    eventBusInstance.dispatch('start-search')
  }, [])

  const handleQueryChangeDebounced = useMemo(
    () =>
      simpleDebounce((query: string, hasQueryError: boolean) => {
        eventBusInstance.dispatch('set-query', query)

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
          matchedFilesCount={matchedFilesCount}
        />
        {isLoading ? (
          <Spinner margin="auto" />
        ) : (
          <SearchResultsList
            matches={results?.matches ?? []}
            getRelativePath={getRelativePath}
            displayLimit={displayLimit}
            extendDisplayLimit={extendDisplayLimit}
            showAllResults={showAllResults}
          />
        )}
      </Flex>
    </Providers>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<Panel />)
