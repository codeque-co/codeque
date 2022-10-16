import {
  getFilesList,
  groupMatchesByFile,
  Matches,
  searchMultiThread,
  SearchResults,
  HardStopFlag,
  createHardStopFlag,
} from '@codeque/core'
import path from 'path'
import * as vscode from 'vscode'
import { eventBusInstance } from './EventBus'
import { StateManager, StateShape } from './StateManager'
export class SearchManager {
  private root: string | undefined
  private searchRunning = false
  private currentSearchHardStopFlag: HardStopFlag | undefined
  private currentFilesGetHardStopFlag: HardStopFlag | undefined
  private maxResultsLimit = 10000

  constructor(private readonly stateManager: StateManager) {
    eventBusInstance.addListener('start-search', this.startSearch)
    eventBusInstance.addListener('stop-search', this.stopCurrentSearch)

    this.root = this.getRoot()
  }

  private getRoot() {
    return vscode.workspace.workspaceFolders?.[0] !== undefined
      ? vscode.workspace.workspaceFolders[0].uri.path
      : undefined
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
    const filePaths = Object.keys(groupedMatches)
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
    if (this.root === undefined) {
      this.root = this.getRoot()
    }

    const searchStart = Date.now()
    let files: string[] = []

    try {
      if (!this.searchRunning) {
        if (this.root !== undefined) {
          this.currentFilesGetHardStopFlag = createHardStopFlag()

          this.currentSearchHardStopFlag = createHardStopFlag()

          this.searchRunning = true
          eventBusInstance.dispatch('search-started')

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

      eventBusInstance.dispatch('have-results', {
        results: {
          matches: [],
          errors: e.message,
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
}
