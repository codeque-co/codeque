import * as vscode from 'vscode'
import { SidebarProvider } from './SidebarProvider'
import { SearchResultsPanel } from './SearchResultsPanel'
import { StateManager } from './StateManager'
import dedent from 'dedent'
import { EventBus, eventBusInstance } from './EventBus'

export function activate(context: vscode.ExtensionContext) {
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

  try {
    const { SearchManager } = require('./SearchManager.ts')
    const searchManager = new SearchManager(stateManager)
  } catch (e: any) {
    vscode.window.showErrorMessage('Failed create search manager ' + e.message)
  }

  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
  )
  item.text = '🔍 Open Search'
  item.command = 'codeque.openSearch'
  item.show()

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'codeque-sidebar',
      sidebarProvider,
    ),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('codeque.openSearch', async () => {
      const { activeTextEditor } = vscode.window

      let selectedCode = ''

      if (activeTextEditor) {
        selectedCode = activeTextEditor.document.getText(
          activeTextEditor.selection,
        )
      }

      if (selectedCode) {
        stateManager.setState({
          query: dedent(selectedCode),
        })
      }

      SearchResultsPanel.createOrShow(extensionUri, stateManager)

      await openSidebar()

      if (selectedCode) {
        eventBusInstance.dispatch('open-search-from-selection')
        eventBusInstance.dispatch('start-search')
      }
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
  void 0
}
