//@ts-ignore
window.Buffer = global.Buffer = {}
//@ts-ignore
window.require = global.require = () => void 0

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Providers } from '../components/Providers'
import { QueryEditor } from './components/QueryEditor'
import { SearchStateShape } from '../../SearchStateManager'
import { ReplaceMode, ReplaceType, SearchFileType } from '../../types'

import { SearchResultsList } from './components/SearchResults'
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  List,
  ListItem,
  Link,
  UnorderedList,
} from '@chakra-ui/react'
import { ResultsMeta } from './components/ResultsMeta'
import { ExtendedSearchResults } from 'types'
import { eventBusInstance } from '../../EventBus'
import { simpleDebounce } from '../../utils'
import { Matches, Mode } from '@codeque/core'
import { ReplacementEditor } from './components/ReplacementEditor'
import { Banners } from './components/Banners'
import { SearchInFileError } from '../../../../core/src/types'

//@ts-ignore - Add typings
const vscode = acquireVsCodeApi()
//@ts-ignore - Add typings
window.vscode = vscode

type ResultsObj = {
  results: ExtendedSearchResults
  time: number
  files: string[]
  isWorkspace: boolean
}
const defaultDisplayLimit = 50

const Panel = () => {
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string | null>(
    null,
  )
  const [query, setQuery] = useState<string | null>(null)
  const [replacement, setReplacement] = useState<string | null>(null)

  const [fileType, setFileType] = useState<SearchFileType | null>(null)
  const [replaceMode, setReplaceMode] = useState<ReplaceMode | null>(null)
  const [replaceType, setReplaceTypeLocal] = useState<ReplaceType | null>(null)

  const [nextSearchIsFromSelection, setNextSearchIsFromSelection] =
    useState<boolean>(false)

  const [mode, setMode] = useState<Mode | null>(null)
  const [hasQueryError, setHasQueryError] = useState<boolean>(false)

  const [initialSettingsReceived, setInitialSettingsReceived] =
    useState<boolean>(false)
  const [results, setResults] = useState<ExtendedSearchResults | undefined>(
    undefined,
  )
  const [replacementErrors, setReplacementErrors] = useState<
    SearchInFileError[]
  >([])

  const [time, setTime] = useState<number | undefined>(undefined)
  const [filesList, setFilesList] = useState<string[] | undefined>(undefined)
  const [isSearching, setIsSearching] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)

  const [displayLimit, setDisplayLimit] = useState(50)
  const [isWorkspace, setIsWorkspace] = useState(false)
  const [proModalVisible, setProModalVisible] = useState(false)

  const selectedText = useRef<string | null>(null)

  const handleSettingsChanged = useCallback(
    (data: Partial<SearchStateShape>) => {
      if (data.mode !== undefined) {
        setMode(data.mode)
      }

      if (data.fileType !== undefined) {
        setFileType(data.fileType)
      }

      if (data.replaceMode !== undefined) {
        setReplaceMode(data.replaceMode)
      }

      if (data.replaceType !== undefined) {
        setReplaceTypeLocal(data.replaceType)
      }
    },
    [],
  )

  const handleInitialSettings = useCallback((data: SearchStateShape) => {
    setInitialSettingsReceived(true)

    if (data.query !== undefined) {
      setLastSearchedQuery(data.query) // to block first auto search
      setQuery(data.query)
    }

    if (data.replacement !== undefined) {
      setReplacement(data.replacement)
    }

    handleSettingsChanged(data)
  }, [])

  const handleResults = useCallback((data: ResultsObj) => {
    setResults(data.results)
    setTime(data.time)
    setFilesList(data.files)
    setIsSearching(false)
    setDisplayLimit(defaultDisplayLimit)
    setNextSearchIsFromSelection(false)
    setIsWorkspace(data.isWorkspace)
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
      workspacesMap: {
        ...partialResults?.workspacesMap,
        ...data.results.workspacesMap,
      },
    }))

    setFilesList((partialFilesList) => [
      ...(partialFilesList ?? []),
      ...data.files,
    ])

    setIsWorkspace(data.isWorkspace)

    setTime(data.time)
    setDisplayLimit(defaultDisplayLimit)
  }, [])

  const handleSearchStart = useCallback((query: string) => {
    setIsSearching(true)
    setResults(undefined)
    setFilesList([])
    setLastSearchedQuery(query)
    setReplacementErrors([])
  }, [])

  const handleReplaceStart = useCallback(() => {
    setIsReplacing(true)
    setReplacementErrors([])
  }, [])

  const handleReplaceFinished = useCallback(({ time }: { time: number }) => {
    setIsReplacing(false)
  }, [])

  const handleReplaceErrors = useCallback(
    ({ errors }: { errors: SearchInFileError[] }) => {
      setReplacementErrors(errors)
    },
    [],
  )

  const startSearch = useCallback(
    (useSelectionIfAvailable = false) => {
      if (selectedText.current && useSelectionIfAvailable) {
        eventBusInstance.dispatch('set-search-settings', {
          query: selectedText.current,
        })

        setQuery(selectedText.current)
        setNextSearchIsFromSelection(true)
      }

      eventBusInstance.dispatch('start-search')
    },
    [selectedText],
  )

  const showProModal = () => {
    setProModalVisible(true)
  }

  const closeProModal = () => {
    setProModalVisible(false)
    eventBusInstance.dispatch('pro-modal:closed')
  }

  const ctaClickProModal = () => {
    setProModalVisible(false)
    eventBusInstance.dispatch('pro-modal:subscribe_clicked')
  }

  const nameClickProModal = () => {
    eventBusInstance.dispatch('pro-modal:twitter_handler_clicked')
  }

  const startReplace = useCallback(() => {
    eventBusInstance.dispatch('start-replace')
    showProModal()
  }, [selectedText])

  const setReplaceType = useCallback((replaceType: ReplaceType) => {
    setReplaceTypeLocal(replaceType)

    eventBusInstance.dispatch('set-search-settings', {
      replaceType,
    })
  }, [])

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

  const handleReplacementChangeDebounced = useMemo(
    () =>
      simpleDebounce((replacement: string) => {
        eventBusInstance.dispatch('set-replacement-in-settings', replacement)
      }, 400),
    [],
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
    eventBusInstance.addListener(
      'search-settings-changed',
      handleSettingsChanged,
    )

    eventBusInstance.addListener(
      'initial-search-settings',
      handleInitialSettings,
    )

    return () => {
      eventBusInstance.removeListener(
        'search-settings-changed',
        handleSettingsChanged,
      )

      eventBusInstance.removeListener(
        'initial-search-settings',
        handleInitialSettings,
      )
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
    eventBusInstance.addListener('replace-started', handleReplaceStart)

    return () => {
      eventBusInstance.removeListener('replace-started', handleReplaceStart)
    }
  }, [handleSearchStart])

  useEffect(() => {
    eventBusInstance.addListener('replace-finished', handleReplaceFinished)

    return () => {
      eventBusInstance.removeListener('replace-finished', handleReplaceFinished)
    }
  }, [handleSearchStart])

  useEffect(() => {
    eventBusInstance.addListener('replace-errors', handleReplaceErrors)

    return () => {
      eventBusInstance.removeListener('replace-errors', handleReplaceErrors)
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

  const getRelativePath = useCallback(
    (filePath: string) => results?.relativePathsMap[filePath],
    [results, results?.relativePathsMap],
  )

  const getWorkspace = useCallback(
    (filePath: string) => results?.workspacesMap[filePath],
    [results, results?.workspacesMap],
  )

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
    if (initialSettingsReceived && replacement !== null) {
      handleReplacementChangeDebounced(replacement)
    }
  }, [initialSettingsReceived, replacement])

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

        eventBusInstance.dispatch('set-search-settings', {
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

  const removeFile = useCallback(
    (filePath: string) => {
      const currentMatches = results?.matches ?? ([] as Matches)
      const newMatches = currentMatches.filter(
        (match) => match.filePath !== filePath,
      )

      setResults({
        ...results,
        matches: newMatches,
      } as ExtendedSearchResults)
    },
    [results],
  )

  const removeWorkspace = useCallback(
    (workspace: string) => {
      const currentMatches = results?.matches ?? ([] as Matches)
      const newMatches = currentMatches.filter(
        (match) => getWorkspace(match.filePath) !== workspace,
      )

      setResults({
        ...results,
        matches: newMatches,
      } as ExtendedSearchResults)
    },
    [results, getWorkspace],
  )

  const stopSearchOrReplace = useCallback(() => {
    eventBusInstance.dispatch('stop-search')
  }, [])

  const allErrors = useMemo(() => {
    return [...(results?.errors ?? []), ...replacementErrors]
  }, [replacementErrors, results?.errors])

  return (
    <Providers>
      <Flex height="98vh" flexDir="column" maxWidth="100wv">
        <Flex width="100%">
          {query !== null && fileType !== null ? (
            <QueryEditor
              query={query}
              setQuery={setQuery}
              mode={mode}
              setHasQueryError={setHasQueryError}
              fileType={fileType}
            />
          ) : null}
          {replacement !== null && fileType !== null && replaceMode !== null ? (
            <ReplacementEditor
              replacement={replacement}
              setReplacement={setReplacement}
              searchMode={mode}
              replaceMode={replaceMode}
              setHasQueryError={setHasQueryError}
              fileType={fileType}
            />
          ) : null}
        </Flex>
        {fileType !== null && mode !== null && replaceType !== null && (
          <ResultsMeta
            time={time}
            startSearch={startSearch}
            startReplace={startReplace}
            filesCount={filesList?.length}
            matchesCount={results?.matches?.length}
            errors={allErrors}
            matchedFilesCount={matchedFilesCount}
            searchInProgress={isSearching}
            replaceInProgress={isReplacing}
            stopSearchOrReplace={stopSearchOrReplace}
            getRelativePath={getRelativePath}
            mode={mode}
            fileType={fileType}
            replaceType={replaceType}
            setReplaceType={setReplaceType}
          />
        )}
        <Banners />
        <SearchResultsList
          isLoading={isSearching}
          matches={results?.matches ?? []}
          getRelativePath={getRelativePath}
          getWorkspace={getWorkspace}
          displayLimit={displayLimit}
          extendDisplayLimit={extendDisplayLimit}
          showAllResults={showAllResults}
          removeMatch={removeMatch}
          removeFile={removeFile}
          removeWorkspace={removeWorkspace}
          searchMode={mode}
          isWorkspace={isWorkspace}
        />
      </Flex>
      <Flex>
        <Modal isOpen={proModalVisible} onClose={closeProModal}>
          <ModalOverlay />
          <ModalContent
            minWidth="500px"
            maxWidth="98vw"
            width="auto"
            backgroundColor={'var(--vscode-editor-background)'}
          >
            <ModalHeader>✨ CodeQue Pro is coming ✨</ModalHeader>
            <ModalCloseButton />
            <ModalBody display="flex" flexDirection="column" gap="6px">
              <Text>
                Hey 👋{' '}
                <Link onClick={nameClickProModal} textDecoration="underline">
                  Jakub
                </Link>{' '}
                here.
              </Text>
              <Text>
                I'm finalizing work on first release of <b>CodeQue Pro!</b>
              </Text>
              <Text>
                Pro version will be packed with handful of useful features:
              </Text>
              <UnorderedList>
                <ListItem>
                  <b>Code replace</b> with meta variables
                </ListItem>
                <ListItem>Search history</ListItem>
                <ListItem>Multiple searches grouped in tabs</ListItem>
                <ListItem>Boolean conditions and nested searches</ListItem>
                <ListItem>Bookmarking Search results</ListItem>
                <ListItem>Editing code directly in results</ListItem>
                <ListItem>Additional search results list in sidebar</ListItem>
                <ListItem>Other UX improvements</ListItem>
              </UnorderedList>
              <Text>
                Features will be released one by one to assure quality.
              </Text>
              <Text>
                Regular <strong>price</strong> of the extension{' '}
                <strong>will be 37€</strong> for perpetual license with 1 year
                of updates.
              </Text>
              <Text>
                By subscribing to CodeQue newsletter you will get{' '}
                <strong>-63% discount price of 17€*!</strong>
              </Text>
              <Text>
                Discount code will be send to all subscribers at the release
                day.
              </Text>
              <Text fontSize={'10px'}>* Local tax applicable</Text>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="purple" mr={3} onClick={ctaClickProModal}>
                Subscribe to book 17€* early bird price 💸
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Flex>
    </Providers>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<Panel />)
