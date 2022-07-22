import * as vscode from 'vscode'
import { SidebarProvider } from './SidebarProvider'
import { SearchResultsPanel } from './SearchResultsPanel'
import { StateManager } from './StateManager'
import { SearchManager } from './SearchManager'
import dedent from 'dedent'

export function activate(context: vscode.ExtensionContext) {
  const { extensionUri } = context

  const stateManager = new StateManager(context.workspaceState)

  // Move to event bus
  const openPanel = () =>
    SearchResultsPanel.createOrShow(extensionUri, stateManager)

  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    stateManager,
    openPanel
  )

  const searchManager = new SearchManager()

  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  )
  item.text = '🔍 Open Search'
  item.command = 'codeque.openSearch'
  item.show()

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'codeque-sidebar',
      sidebarProvider
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('codeque.openSearch', async () => {
      const { activeTextEditor } = vscode.window

      let selectedCode = ''

      if (activeTextEditor) {
        selectedCode = activeTextEditor.document.getText(
          activeTextEditor.selection
        )
      }

      SearchResultsPanel.createOrShow(extensionUri, stateManager)

      await vscode.commands.executeCommand(
        'workbench.view.extension.codeque-sidebar-view'
      )

      if (selectedCode) {
        stateManager.setState({
          query: dedent(selectedCode)
        })
      }
    })
  )

  context.subscriptions.push(
    // Thanks Ben
    vscode.commands.registerCommand('codeque.refresh', async () => {
      SearchResultsPanel.kill()
      SearchResultsPanel.createOrShow(extensionUri, stateManager)
      await vscode.commands.executeCommand('workbench.action.closeSidebar')

      await vscode.commands.executeCommand(
        'workbench.view.extension.codeque-sidebar-view'
      )

      // setTimeout(() => {
      //   vscode.commands.executeCommand(
      //     'workbench.action.webview.openDeveloperTools'
      //   )
      // }, 500)
    })
  )
}

// this method is called when your extension is deactivated
export function deactivate() {
  void 0
}
