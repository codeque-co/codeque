//@ts-ignore
window.Buffer = global.Buffer = {}
//@ts-ignore
window.require = global.require = () => void 0

import { useEffect, useState, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { Providers } from '../components/Providers'
import { QueryEditor } from './components/QueryEditor'
import { StateShape } from '../../StateManager'
import { SearchResultsList } from './components/SearchResults'
import { Flex, Spinner } from '@chakra-ui/react'
import { ResultsMeta } from './components/ResultsMeta'
import { ExtendedSearchResults } from 'types'
import { eventBusInstance } from '../../EventBus'

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
  const [query, setQuery] = useState<string | null>(null)
  const [mode, setMode] = useState<string | null>(null)

  const [results, setResults] = useState<ExtendedSearchResults | undefined>(
    undefined
  )
  const [time, setTime] = useState<number | undefined>(undefined)
  const [filesList, setFilesList] = useState<string[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(50)

  const handleSettingsChanged = useCallback((data: StateShape) => {
    setQuery(data.query)
    setMode(data.mode)
  }, [])

  const handleResults = useCallback((data: ResultsObj) => {
    setResults(data.results)
    setTime(data.time)
    setFilesList(data.files)
    setIsLoading(false)
    setDisplayLimit(defaultDisplayLimit)
  }, [])

  const handleSearchStart = useCallback(() => {
    setIsLoading(true)
  }, [])

  const saveQueryInSettings = useCallback(() => {
    eventBusInstance.dispatch('set-query', query)
  }, [query, setIsLoading])

  useEffect(() => {
    eventBusInstance.env = 'search-results'
    window.addEventListener('message', eventBusInstance.pipeFromWindowMessage)
    const postMessage = (...args: any[]) => vscode.postMessage(...args)
    eventBusInstance.addTransport(postMessage)

    eventBusInstance.dispatch('panel-open')

    return () => {
      eventBusInstance.removeTransport(postMessage)

      window.removeEventListener(
        'message',
        eventBusInstance.pipeFromWindowMessage
      )
    }
  }, [])

  useEffect(() => {
    eventBusInstance.addListener('settings-changed', handleSettingsChanged)
    eventBusInstance.addListener('initial-settings', handleSettingsChanged)

    return () => {
      eventBusInstance.removeListener('settings-changed', handleSettingsChanged)
      eventBusInstance.removeListener('initial-settings', handleSettingsChanged)
    }
  }, [handleSettingsChanged])

  useEffect(() => {
    eventBusInstance.addListener('have-results', handleResults)

    return () => {
      eventBusInstance.removeListener('have-results', handleResults)
    }
  }, [handleResults])

  useEffect(() => {
    eventBusInstance.addListener('search-start', handleSearchStart)

    return () => {
      eventBusInstance.removeListener('search-start', handleSearchStart)
    }
  }, [handleResults])

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

  return (
    <Providers>
      <Flex height="98vh" flexDir="column">
        {query !== null ? (
          <QueryEditor query={query} setQuery={setQuery} mode={mode} />
        ) : null}
        <ResultsMeta
          time={time}
          startSearch={saveQueryInSettings}
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
