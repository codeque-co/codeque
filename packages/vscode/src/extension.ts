import * as vscode from 'vscode'
import { SidebarProvider } from './SidebarProvider'
import { SearchResultsPanel } from './SearchResultsPanel'
import { StateManager, StateShape } from './StateManager'
import { eventBusInstance } from './EventBus'
import { SearchManager } from './SearchManager'
import {
  parseQueries,
  extensionTester,
  pathToPosix,
  __internal,
} from '@codeque/core'
import { sanitizeFsPath } from './nodeUtils'
import path from 'path'
import {
  dedentPatched,
  SupportedParsers,
  supportedParsers,
  parserToFileTypeMap,
} from './utils'
import { activateReporter } from './telemetry'

let dispose = (() => undefined) as () => void

export function activate(context: vscode.ExtensionContext) {
  const telemetryReporter = activateReporter()
  context.subscriptions.push(telemetryReporter)

  const { extensionUri } = context

  const stateManager = new StateManager(context.workspaceState)

  const openSearchResults = () =>
    SearchResultsPanel.createOrShow(extensionUri, stateManager)

  const openSidebar = async () =>
    vscode.commands.executeCommand(
      'workbench.view.extension.codeque-sidebar-view',
    )
  eventBusInstance.addListener('show-results-panel', openSearchResults)

  eventBusInstance.addListener('results-panel-visibility', (isVisible) => {
    if (isVisible) {
      openSidebar()
    }
  })

  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    stateManager,
  )

  const searchManager = new SearchManager(stateManager, telemetryReporter)

  dispose = searchManager.dispose
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
  )
  item.text = '🔍 Open Search'
  item.command = 'codeque.searchWithOptionalQuerySelectionFromEditor'
  item.show()

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'codeque-sidebar',
      sidebarProvider,
    ),
  )

  const openSearchWithOptionalQueryFromEditorSelection = async (
    newSearchSettings?: Partial<StateShape>,
  ) => {
    const { activeTextEditor } = vscode.window

    let selectedCode: string | null = ''

    const state = stateManager.getState()

    if (activeTextEditor) {
      selectedCode = activeTextEditor.document.getText(
        activeTextEditor.selection,
      )
    } else {
      selectedCode = state.webviewTextSelection
    }

    const newQuery =
      selectedCode && /^\s/.test(selectedCode)
        ? dedentPatched(selectedCode)
        : selectedCode

    if (newQuery) {
      let foundParser: SupportedParsers | null = null

      for (const parser of supportedParsers) {
        const [, queryParseOk] = parseQueries(
          [newQuery],
          false,
          __internal.parserSettingsMap[parser](),
        )

        if (queryParseOk) {
          foundParser = parser
          break
        }
      }

      stateManager.setState({
        query: newQuery,
        mode: !foundParser && state.mode !== 'text' ? 'text' : state.mode,
        fileType: !foundParser ? 'all' : parserToFileTypeMap[foundParser],
      })
    }

    if (newSearchSettings) {
      stateManager.setState(newSearchSettings)
    }

    SearchResultsPanel.createOrShow(extensionUri, stateManager)

    await openSidebar()

    if (newQuery) {
      eventBusInstance.dispatch('open-search-from-selection')
      eventBusInstance.dispatch('set-query-on-ui', newQuery)
    }

    if (newQuery || newSearchSettings) {
      eventBusInstance.dispatch('start-search')
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'codeque.searchWithOptionalQuerySelectionFromEditor',
      async (data) => {
        openSearchWithOptionalQueryFromEditorSelection()
      },
    ),
    vscode.commands.registerCommand(
      'codeque.searchByEntryPoint',
      async (data) => {
        const searchPath = sanitizeFsPath(data.fsPath)
        const searchRoots = searchManager.getRoots()

        if (!searchRoots) {
          vscode.window.showErrorMessage(
            'Search error: Could not determine search root.',
          )

          return
        }

        const searchRoot =
          searchManager.matchRoot(searchRoots, searchPath)?.path ?? ''

        const rootToFindRelative =
          searchManager.getRootForFileListFilters(searchRoot)

        const relativePath = path.relative(rootToFindRelative, searchPath)

        const { ext } = path.parse(relativePath)

        if (!extensionTester.test(ext)) {
          vscode.window.showErrorMessage(
            'Search error: Unsupported entry point file extension: ' + ext,
          )

          return
        }

        await openSearchWithOptionalQueryFromEditorSelection({
          entryPoint: relativePath,
        })
      },
    ),
    vscode.commands.registerCommand('codeque.searchInFolder', async (data) => {
      const searchPath = sanitizeFsPath(data.fsPath)
      const searchRoots = searchManager.getRoots()

      if (!searchRoots) {
        vscode.window.showErrorMessage(
          'Search error: Could not determine search root.',
        )

        return
      }

      const searchRoot =
        searchManager.matchRoot(searchRoots, searchPath)?.path ?? ''

      const rootToFindRelative =
        searchManager.getRootForFileListFilters(searchRoot)

      const relativePath = path.relative(rootToFindRelative, searchPath)

      await openSearchWithOptionalQueryFromEditorSelection({
        include: [`${pathToPosix(relativePath)}/**`],
      })
    }),
  )

  context.subscriptions.push(
    // Thanks Ben
    vscode.commands.registerCommand('codeque.refresh', async () => {
      SearchResultsPanel.kill()
      SearchResultsPanel.createOrShow(extensionUri, stateManager)
      await vscode.commands.executeCommand('workbench.action.closeSidebar')

      await vscode.commands.executeCommand(
        'workbench.view.extension.codeque-sidebar-view',
      )

      // setTimeout(() => {
      //   vscode.commands.executeCommand(
      //     'workbench.action.webview.openDeveloperTools'
      //   )
      // }, 500)
    }),
  )
}

// this method is called when your extension is deactivated
export function deactivate() {
  dispose()
  void 0
}
