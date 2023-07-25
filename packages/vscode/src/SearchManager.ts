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
  typeScriptFamilyExtensionTester,
  cssExtensionTester,
  htmlFamilyExtensionTester,
  filterExtensions,
  pythonExtensionTester,
  __internal,
} from '@codeque/core'
import {
  getMainSearchExtensionFromFilesList,
  sanitizeFsPath,
} from './nodeUtils'
import path from 'path'
import * as vscode from 'vscode'
import { eventBusInstance } from './EventBus'
import { StateManager, StateShape, SearchFileType } from './StateManager'
import {
  simpleDebounce,
  fileTypeToParserMap,
  nonSearchableExtensions,
} from './utils'
import { TelemetryModule } from './telemetry'
import { isQueryRestricted } from './restrictedQueries'

type FilesLists = {
  files: string[]
  root: string
}[]

type Root = { path: string; name?: string }

const extensionTesterMap: Record<SearchFileType, RegExp> = {
  all: /\.(.)+$/,
  html: htmlFamilyExtensionTester,
  'js-ts-json': typeScriptFamilyExtensionTester,
  css: cssExtensionTester,
  python: pythonExtensionTester,
}

export class SearchManager {
  private isWorkspace: boolean | undefined
  private roots: Root[] | undefined
  private searchRunning = false
  private currentSearchHardStopFlag: HardStopFlag | undefined
  private currentFilesGetHardStopFlag: HardStopFlag | undefined
  private maxResultsLimit = 10000
  private filesListState = {
    isWatching: false,
    state: 'idle' as 'idle' | 'processing' | 'error' | 'ready',
    filesLists: [] as FilesLists,
    watchers: [] as {
      rootPath: string
      watcher: vscode.FileSystemWatcher
    }[],
    workspaceFoldersChangeListener: undefined as vscode.Disposable | undefined,
  }
  private lastSearchSettings: StateShape | undefined
  private telemetryReporter: TelemetryModule

  constructor(
    private readonly stateManager: StateManager,
    telemetryReporter: TelemetryModule,
  ) {
    eventBusInstance.addListener('start-search', this.startSearch)
    eventBusInstance.addListener('stop-search', this.stopCurrentSearch)

    this.initializeSearchRoots()
    this.maybeStartWatchingFilesList()
    this.watchWorkspaceChanges()
    this.telemetryReporter = telemetryReporter
  }

  private determineRoots() {
    const searchRoots = vscode.workspace.workspaceFolders?.map(
      (workspaceFolder) => ({
        path: sanitizeFsPath(workspaceFolder.uri.fsPath),
        name: workspaceFolder.name,
      }),
    )

    return searchRoots
  }

  private determineIsWorkspace() {
    return Boolean(vscode.workspace.workspaceFile)
  }

  private initializeSearchRoots() {
    this.isWorkspace = this.determineIsWorkspace()
    this.roots = this.determineRoots()
  }

  private async getFilesListForBasicSearch() {
    this.filesListState.state = 'processing'
    const lastSearchSettings = this.lastSearchSettings

    const roots = this.roots

    if (roots && lastSearchSettings !== undefined) {
      if (
        !lastSearchSettings.searchIgnoredFiles &&
        !lastSearchSettings.searchNodeModules &&
        !lastSearchSettings.entryPoint &&
        !lastSearchSettings.searchBigFiles
      ) {
        try {
          const listsForRoots = await Promise.all(
            roots.map((root) =>
              getFilesList({
                searchRoot: root.path,
                ignoreNodeModules: true,
                omitGitIgnore: false,
                extensionTester: /\.(\w)+$/,
              }),
            ),
          )

          this.filesListState.filesLists = listsForRoots.map(
            (filesList, idx) => ({
              root: roots[idx].path,
              files: filesList,
            }),
          )

          this.filesListState.state = 'ready'

          return this.filesListState.filesLists
        } catch (e) {
          this.filesListState.state = 'error'

          const error = e as Error

          vscode.window.showErrorMessage(
            'Search error: Failed to get files lists: ' +
              error?.message +
              '\n\nStack:\n' +
              error?.stack,
          )

          console.error(error)

          return []
        }
      }
    }

    this.filesListState.state = 'idle'

    return []
  }

  /**
   * This could be improved to handling changes for one workspace instead of resetting everything for all of them.
   * Skipping for now as it's not required.
   * Also getting files list could be optimized to refetch per folder when files change
   */
  private watchWorkspaceChanges() {
    const handleWorkspaceFoldersChangeDebounced = simpleDebounce(() => {
      this.resetFilesListsWatchers()
      this.initializeSearchRoots()
      this.maybeStartWatchingFilesList()
      this.getFilesListForBasicSearch()
    }, 500)

    this.filesListState.workspaceFoldersChangeListener =
      vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        handleWorkspaceFoldersChangeDebounced()
      })
  }

  private resetFilesListsWatchers() {
    this.filesListState.watchers.forEach(({ watcher, rootPath: root }) => {
      watcher.dispose()
    })

    this.filesListState.watchers = []
    this.filesListState.isWatching = false
  }

  private maybeStartWatchingFilesList() {
    if (this.roots && !this.filesListState.isWatching) {
      this.filesListState.isWatching = true

      this.roots.forEach((root) => {
        const watcher = vscode.workspace.createFileSystemWatcher(
          // It's fine to watch everything, as it do not include node_modules by default
          new vscode.RelativePattern(root.path, '**'),
          false,
          true,
          false,
        )

        const handleFileChangeDebounced = simpleDebounce(() => {
          this.getFilesListForBasicSearch()
        }, 200)

        watcher.onDidCreate(handleFileChangeDebounced)
        watcher.onDidDelete(handleFileChangeDebounced)

        this.filesListState.watchers.push({
          rootPath: root.path,
          watcher,
        })
      })
    }
  }

  private startSearch = () => {
    const state = this.stateManager.getState()

    if (!isQueryRestricted(state.query, state.fileType)) {
      this.performSearch(state)
    }
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
    searchRoots: Root[],
    isWorkspace: boolean,
  ) => {
    const groupedMatches = groupMatchesByFile(searchResults.matches)
    const filePathsFromErrors = searchResults.errors
      .map((e: unknown) => (e as SearchInFileError)?.filePath)
      .filter(Boolean)

    const filePaths = Object.keys(groupedMatches).concat(filePathsFromErrors)

    const relativePathsMap = filePaths.reduce((map, filePath) => {
      const searchRoot = this.matchRoot(searchRoots, filePath)?.path ?? ''
      map[filePath] = path.relative(searchRoot, filePath)

      return map
    }, {} as Record<string, string>)

    const workspacesMap = isWorkspace
      ? filePaths.reduce((map, filePath) => {
          const searchRoot = this.matchRoot(searchRoots, filePath)
          map[filePath] = searchRoot?.name ?? ''

          return map
        }, {} as Record<string, string>)
      : {}

    return {
      ...searchResults,
      groupedMatches,
      relativePathsMap,
      workspacesMap,
    }
  }

  public getRoots = () => {
    return this.roots ?? this.determineRoots()
  }

  public getIsWorkspace = () => {
    return this.isWorkspace ?? this.determineIsWorkspace()
  }

  public matchRoot = (searchRoots: Root[], filePath: string) => {
    return searchRoots.find((searchRoot) => filePath.includes(searchRoot.path))
  }

  /**
   *
   * Use for adjusting the root for workspaces while filtering files
   * It's not needed for getting normal files list, as we do not filter nor search by entry point there
   */
  public getRootForFileListFilters = (root: string) => {
    const isWorkspace = this.getIsWorkspace()

    return isWorkspace ? path.resolve(root, '../') : root
  }

  private getEntryPointPathForRoot = (
    root: string,
    entryPoint?: string | null,
  ) => {
    if (!entryPoint) {
      return undefined
    }

    const entryPointNoDot = entryPoint.replace(/^\.(\\|\/)/g, '')

    const isWorkspace = this.getIsWorkspace()
    const rootSegments = path.parse(root)

    if (!isWorkspace || !entryPointNoDot.startsWith(rootSegments.base)) {
      return entryPointNoDot
    }

    const adjustedEntryPoint = path.relative(rootSegments.base, entryPointNoDot)

    return adjustedEntryPoint
  }

  public performSearch = async (settings: StateShape) => {
    this.lastSearchSettings = settings

    if (this.roots === undefined) {
      this.initializeSearchRoots()
      this.maybeStartWatchingFilesList()
    }

    const searchStart = Date.now()
    const roots = this.roots
    const isWorkspace = this.isWorkspace

    try {
      if (!this.searchRunning) {
        if (roots !== undefined && typeof isWorkspace === 'boolean') {
          this.currentFilesGetHardStopFlag = createHardStopFlag()

          this.currentSearchHardStopFlag = createHardStopFlag()

          this.searchRunning = true
          eventBusInstance.dispatch('search-started', settings.query)

          let filesLists: FilesLists = this.filesListState.filesLists

          if (
            settings.searchIgnoredFiles ||
            settings.searchNodeModules ||
            settings.entryPoint ||
            settings.searchBigFiles
          ) {
            const filesListsForRoots = await Promise.all(
              roots.map((root) =>
                getFilesList({
                  searchRoot: root.path,
                  ignoreNodeModules: !settings.searchNodeModules,
                  omitGitIgnore: settings.searchIgnoredFiles,
                  entryPoint: this.getEntryPointPathForRoot(
                    root.path,
                    settings.entryPoint,
                  ),
                  hardStopFlag: this.currentFilesGetHardStopFlag,
                  searchBigFiles: settings.searchBigFiles,
                  // Cannot use exclude/include on this level
                  // Using it requires changing root if in workspaces mode
                  // Changing root breaks entry points search.
                }),
              ),
            )

            filesLists = filesListsForRoots.map((filesList, idx) => ({
              root: roots[idx].path,
              files: filesList,
            }))
          } else if (this.filesListState.state === 'idle') {
            filesLists = await this.getFilesListForBasicSearch()
          }

          const filteredFilesLists = filesLists.map(({ root, files }) =>
            filterIncludeExclude({
              searchRoot: this.getRootForFileListFilters(root),
              filesList: files,
              exclude: settings.exclude,
              include:
                settings.include?.length > 0 ? settings.include : undefined,
            }),
          )

          const files = filteredFilesLists.flat(1)

          const getFilesEnd = Date.now()

          if (this.currentSearchHardStopFlag.stopSearch) {
            eventBusInstance.dispatch('have-results', {
              results: {
                matches: [],
                errors: [],
                hints: [],
                relativePathsMap: {},
                groupedMatches: {},
                workspacesMap: {},
              },
              time: 0,
              files: [],
              isWorkspace,
            })

            this.searchRunning = false
            this.currentFilesGetHardStopFlag.destroy()
            this.currentSearchHardStopFlag.destroy()
            this.currentFilesGetHardStopFlag = undefined
            this.currentSearchHardStopFlag = undefined

            return
          }

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
                  roots,
                  isWorkspace,
                ),
                time: (timestamp - searchStart) / 1000,
                files: [],
                isWorkspace,
              })
            }
          }

          const extensionTester = extensionTesterMap[settings.fileType]

          const filesListFilteredByExtension = filterExtensions(
            files,
            extensionTester,
          ).filter(
            (filePath) =>
              !nonSearchableExtensions.some((nonSearchableExtension) =>
                filePath.endsWith(nonSearchableExtension),
              ),
          )

          const parser = fileTypeToParserMap[settings.fileType]

          await __internal.parserSettingsMap[parser]().parserInitPromise

          await new Promise<void>((resolve, reject) => {
            // We start search in next tick so not block events delivery and UI update
            setTimeout(
              (async () => {
                try {
                  const results = await searchMultiThread({
                    parser,
                    filePaths: filesListFilteredByExtension,
                    queryCodes: [settings.query],
                    mode: settings.mode,
                    caseInsensitive: settings.caseType === 'insensitive',
                    onPartialResult: reportPartialResults,
                    hardStopFlag: this.currentSearchHardStopFlag,
                    maxResultsLimit: this.maxResultsLimit,
                  })

                  const searchEnd = Date.now()

                  const searchTime = (searchEnd - searchStart) / 1000

                  const processedResults = this.processSearchResults(
                    { ...results, matches: allPartialMatches },
                    roots,
                    isWorkspace,
                  )

                  eventBusInstance.dispatch('have-results', {
                    results: processedResults,
                    time: searchTime,
                    files: filesListFilteredByExtension,
                    isWorkspace,
                  })

                  this.searchRunning = false
                  this.currentFilesGetHardStopFlag?.destroy()
                  this.currentSearchHardStopFlag?.destroy()
                  this.currentFilesGetHardStopFlag = undefined
                  this.currentSearchHardStopFlag = undefined

                  const mainExt = getMainSearchExtensionFromFilesList(
                    filesListFilteredByExtension,
                  )

                  this.telemetryReporter.reportSearch({
                    mode: settings.mode,
                    caseType: settings.caseType,
                    fileType: settings.fileType,
                    isWorkspace: isWorkspace ? 'true' : 'false',
                    queryLength: settings.query.length,
                    searchTime: searchTime,
                    resultsCount: processedResults.matches.length,
                    errorsCount: processedResults.errors.length,
                    searchedFilesCount: filesListFilteredByExtension.length,
                    mainExt: mainExt,
                  })

                  resolve()
                } catch (e) {
                  reject(e)
                }
              }).bind(this),
              0,
            )
          })

          // console.log(
          //   'files:',
          //   (getFilesEnd - searchStart) / 1000,
          //   'search:',
          //   (searchEnd - getFilesEnd) / 1000,
          //   'total',
          //   (searchEnd - searchStart) / 1000,
          // )
        } else {
          vscode.window.showWarningMessage(
            'Search error: Could not determine search root.\nPlease open a directory of workspace to start searching.',
          )
        }
      }
    } catch (e: any) {
      const error = e as Error

      vscode.window.showErrorMessage(
        'Search error: ' + error?.message + '\n\nStack:\n' + error?.stack,
      )

      console.error(typeof error, error, error.stack, error.message)

      const searchTime = (Date.now() - searchStart) / 1000

      eventBusInstance.dispatch('have-results', {
        results: {
          matches: [],
          errors: [e.message],
          hints: [],
          relativePathsMap: {},
          groupedMatches: {},
          workspacesMap: {},
        },
        time: searchTime,
        files: [],
        isWorkspace: isWorkspace ?? false,
      })

      this.searchRunning = false

      this.telemetryReporter.reportSearchError({
        mode: settings.mode,
        caseType: settings.caseType,
        fileType: settings.fileType,
        isWorkspace: isWorkspace ? 'true' : 'false',
        queryLength: settings.query.length,
        searchTime,
      })
    }
  }
  public dispose() {
    this.filesListState.watchers.forEach(({ watcher }) => {
      watcher.dispose()
    })

    this.filesListState.workspaceFoldersChangeListener?.dispose()

    eventBusInstance.removeListener('start-search', this.startSearch)
    eventBusInstance.removeListener('stop-search', this.stopCurrentSearch)
  }
}
