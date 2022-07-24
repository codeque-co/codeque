import * as vscode from 'vscode'
import { StateManager, StateShape } from './StateManager'
import {
  searchMultiThread,
  getFilesList,
  SearchResults,
  groupMatchesByFile
} from '@codeque/core'
import path from 'path'
import { ExtendedSearchResults } from './types'
import { eventBusInstance } from './EventBus'

export class SearchManager {
  private root: string | undefined

  constructor(private readonly stateManager: StateManager) {
    eventBusInstance.addListener('start-search', this.startSearch)

    this.root =
      vscode.workspace.workspaceFolders?.[0] !== undefined
        ? vscode.workspace.workspaceFolders[0].uri.path
        : undefined
  }

  private startSearch = () => {
    this.performSearch(this.stateManager.getState())
  }

  private processSearchResults = (
    searchResults: SearchResults,
    searchRoot: string
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
      relativePathsMap
    }
  }

  public performSearch = async (settings: StateShape) => {
    try {
      if (this.root !== undefined) {
        console.log('start search')
        console.log('root', this.root)
        eventBusInstance.dispatch('search-started')
        const searchStart = Date.now()
        const files = await getFilesList({ searchRoot: this.root })
        const getFilesEnd = Date.now()
        console.log('getFiles', getFilesEnd - searchStart)
        const results = await searchMultiThread({
          filePaths: files,
          queryCodes: [settings.query],
          mode: settings.mode,
          caseInsensitive: settings.caseType === 'insensitive'
        })
        const searchEnd = Date.now()
        console.log('end search', searchEnd - getFilesEnd)

        eventBusInstance.dispatch('have-results', {
          results: this.processSearchResults(results, this.root),
          time: (searchEnd - searchStart) / 1000,
          files
        })
      } else {
        vscode.window.showErrorMessage(
          'Search error: Could not determine search root.'
        )
      }
    } catch (e) {
      vscode.window.showErrorMessage('Search error: ' + (e as Error).message)
    }
  }

  public openFileInEditor(filePath: string) {
    vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then((doc) => {
      console.log(doc)
    })
  }
}
