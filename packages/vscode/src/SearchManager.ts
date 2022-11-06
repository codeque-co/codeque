import {
  getFilesList,
  groupMatchesByFile,
  Matches,
  searchMultiThread,
  SearchResults,
  HardStopFlag,
  createHardStopFlag,
  filterIncludeExclude,
  SearchInFileError,
} from '@codeque/core'
import path from 'path'
import * as vscode from 'vscode'
import { eventBusInstance } from './EventBus'
import { StateManager, StateShape } from './StateManager'
import { simpleDebounce } from './utils'
export class SearchManager {
  private root: string | undefined
  private searchRunning = false
  private currentSearchHardStopFlag: HardStopFlag | undefined
  private currentFilesGetHardStopFlag: HardStopFlag | undefined
  private maxResultsLimit = 10000
  private filesListState = {
    isWatching: false,
    state: 'idle' as 'idle' | 'processing' | 'error' | 'ready',
    list: [] as string[],
    watcher: null as vscode.FileSystemWatcher | null,
  }
  private lastSearchSettings: StateShape | undefined

  constructor(private readonly stateManager: StateManager) {
    eventBusInstance.addListener('start-search', this.startSearch)
    eventBusInstance.addListener('stop-search', this.stopCurrentSearch)

    this.root = this.getRoot()
    this.maybeStartWatchingFilesList()
  }

  private getRoot() {
    const isWindows = process.platform.includes('win32')
    const searchRoot =
      vscode.workspace.workspaceFolders?.[0] !== undefined
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined

    if (searchRoot !== undefined) {
      // For some reason vscode return lowercased drive letters on windows :/
      if (isWindows && /^[a-z]:\\/.test(searchRoot)) {
        const searchRootFsRoot = path.parse(searchRoot).root
        const upperCasedSearchRootFsRoot = searchRootFsRoot.toUpperCase()

        return searchRoot.replace(searchRootFsRoot, upperCasedSearchRootFsRoot)
      }

      return searchRoot
    }

    return undefined
  }

  private async getFilesListForBasicSearch() {
    this.filesListState.state = 'processing'
    const lastSearchSettings = this.lastSearchSettings

    if (this.root && lastSearchSettings !== undefined) {
      if (
        !lastSearchSettings.searchIgnoredFiles &&
        !lastSearchSettings.searchNodeModules &&
        !lastSearchSettings.entryPoint
      ) {
        try {
          this.filesListState.list = await getFilesList({
            searchRoot: this.root,
            ignoreNodeModules: true,
            omitGitIgnore: false,
          })

          this.filesListState.state = 'ready'

          return
        } catch (e) {
          this.filesListState.state = 'error'

          vscode.window.showErrorMessage(
            'Search error: Failed to get files list: ' + (e as Error)?.message,
          )

          return
        }
      }
    }

    this.filesListState.state = 'idle'
  }

  private maybeStartWatchingFilesList() {
    if (this.root && !this.filesListState.isWatching) {
      this.filesListState.isWatching = true

      this.filesListState.watcher = vscode.workspace.createFileSystemWatcher(
        // It's fine to watch everything, as it do not include node_modules by default
        new vscode.RelativePattern(this.root, '**'),
        false,
        true,
        false,
      )

      const handleFileChangeDebounced = simpleDebounce(
        () => this.getFilesListForBasicSearch(),
        100,
      )

      this.filesListState.watcher.onDidCreate(handleFileChangeDebounced)
      this.filesListState.watcher.onDidDelete(handleFileChangeDebounced)
    }
  }

  private startSearch = () => {
    this.performSearch(this.stateManager.getState())
  }

  private stopCurrentSearch = () => {
    if (this.currentFilesGetHardStopFlag) {
      this.currentFilesGetHardStopFlag.stopSearch = true
    }

    if (this.currentSearchHardStopFlag) {
      this.currentSearchHardStopFlag.stopSearch = true
    }
  }

  private processSearchResults = (
    searchResults: SearchResults,
    searchRoot: string,
  ) => {
    const groupedMatches = groupMatchesByFile(searchResults.matches)
    const filePathsFromErrors = searchResults.errors
      .map((e: unknown) => (e as SearchInFileError)?.filePath)
      .filter(Boolean)

    const filePaths = Object.keys(groupedMatches).concat(filePathsFromErrors)
    const relativePathsMap = filePaths.reduce((map, filePath) => {
      map[filePath] = path.relative(searchRoot, filePath)

      return map
    }, {} as Record<string, string>)

    return {
      ...searchResults,
      groupedMatches,
      relativePathsMap,
    }
  }

  public performSearch = async (settings: StateShape) => {
    this.lastSearchSettings = settings

    if (this.root === undefined) {
      this.root = this.getRoot()
      this.maybeStartWatchingFilesList()
    }

    const searchStart = Date.now()
    let files: string[] = []

    try {
      if (!this.searchRunning) {
        if (this.root !== undefined) {
          this.currentFilesGetHardStopFlag = createHardStopFlag()

          this.currentSearchHardStopFlag = createHardStopFlag()

          this.searchRunning = true
          eventBusInstance.dispatch('search-started', settings.query)

          if (
            !settings.searchIgnoredFiles &&
            !settings.searchNodeModules &&
            !settings.entryPoint
          ) {
            if (this.filesListState.state === 'idle') {
              await this.getFilesListForBasicSearch()
            }

            files = filterIncludeExclude({
              searchRoot: this.root,
              filesList: this.filesListState.list,
              exclude: settings.exclude,
              include:
                settings.include?.length > 0 ? settings.include : undefined,
            })
          } else {
            files = await getFilesList({
              searchRoot: this.root,
              ignoreNodeModules: !settings.searchNodeModules,
              omitGitIgnore: settings.searchIgnoredFiles,
              include:
                settings.include?.length > 0 ? settings.include : undefined,
              exclude: settings.exclude,
              entryPoint: settings.entryPoint ?? undefined,
              hardStopFlag: this.currentFilesGetHardStopFlag,
            })
          }

          const getFilesEnd = Date.now()

          if (this.currentSearchHardStopFlag.stopSearch) {
            eventBusInstance.dispatch('have-results', {
              results: {
                matches: [],
                errors: [],
                hints: [],
                relativePathsMap: {},
                groupedMatches: {},
              },
              time: 0,
              files: [],
            })

            this.searchRunning = false
            this.currentFilesGetHardStopFlag.destroy()
            this.currentSearchHardStopFlag.destroy()
            this.currentFilesGetHardStopFlag = undefined
            this.currentSearchHardStopFlag = undefined

            return
          }

          const root = this.root

          let reportedResults = 0
          const partialReportedLimit = 50
          const allPartialMatches: Matches = []
          const reportPartialResults = (matches: Matches) => {
            allPartialMatches.push(...matches)

            if (reportedResults < partialReportedLimit) {
              const timestamp = Date.now()
              reportedResults += matches.length

              eventBusInstance.dispatch('have-partial-results', {
                results: this.processSearchResults(
                  { matches, errors: [], hints: [] },
                  root,
                ),
                time: (timestamp - searchStart) / 1000,
                files: [],
              })
            }
          }

          const results = await searchMultiThread({
            filePaths: files,
            queryCodes: [settings.query],
            mode: settings.mode,
            caseInsensitive: settings.caseType === 'insensitive',
            onPartialResult: reportPartialResults,
            hardStopFlag: this.currentSearchHardStopFlag,
            maxResultsLimit: this.maxResultsLimit,
          })
          const searchEnd = Date.now()

          eventBusInstance.dispatch('have-results', {
            results: this.processSearchResults(
              { ...results, matches: allPartialMatches },
              root,
            ),
            time: (searchEnd - searchStart) / 1000,
            files,
          })

          this.searchRunning = false
          this.currentFilesGetHardStopFlag.destroy()
          this.currentSearchHardStopFlag.destroy()
          this.currentFilesGetHardStopFlag = undefined
          this.currentSearchHardStopFlag = undefined

          // console.log(
          //   'files:',
          //   (getFilesEnd - searchStart) / 1000,
          //   'search:',
          //   (searchEnd - getFilesEnd) / 1000,
          //   'total',
          //   (searchEnd - searchStart) / 1000,
          // )
        } else {
          vscode.window.showErrorMessage(
            'Search error: Could not determine search root.',
          )
        }
      }
    } catch (e: any) {
      vscode.window.showErrorMessage('Search error: ' + (e as Error).message)

      console.error(e)

      eventBusInstance.dispatch('have-results', {
        results: {
          matches: [],
          errors: [e.message],
          hints: [],
          relativePathsMap: {},
          groupedMatches: {},
        },
        time: (Date.now() - searchStart) / 1000,
        files: files,
      })

      this.searchRunning = false
    }
  }
  public dispose() {
    this.filesListState.watcher?.dispose()
    eventBusInstance.removeListener('start-search', this.startSearch)
    eventBusInstance.removeListener('stop-search', this.stopCurrentSearch)
  }
}
