import * as vscode from 'vscode'
import { searchMultiThread, getFilesList } from '@codeque/core'
import { SidebarProvider } from './SidebarProvider'
import { SearchResultsPanel } from './SearchResultsPanel'
import { StateManager } from './StateManager'

export function activate(context: vscode.ExtensionContext) {
  const { extensionUri } = context

  const stateManager = new StateManager(context.workspaceState)

  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    stateManager,
    () => SearchResultsPanel.createOrShow(extensionUri, stateManager)
  )

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
    vscode.commands.registerCommand('codeque.helloWorld', async () => {
      vscode.window.showInformationMessage('Hello World from CodeQue!')
      const root =
        vscode.workspace.workspaceFolders?.[0] !== undefined
          ? vscode.workspace.workspaceFolders[0].uri
          : undefined

      if (root !== undefined) {
        const files = await getFilesList({ searchRoot: root.path })
        console.log('files count', files.length)
        const results = await searchMultiThread({
          filePaths: files,
          queryCodes: ['console.log()'],
          mode: 'include'
        })
        console.log('results count:', results.matches.length)
      }
    })
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
          query: selectedCode
        })
      }
    })
  )
}

// this method is called when your extension is deactivated
export function deactivate() {
  void 0
}
