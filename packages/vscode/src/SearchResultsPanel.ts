import { Match } from '@codeque/core'
import dedent from 'dedent'
import * as vscode from 'vscode'
import { eventBusInstance } from './EventBus'
import { getNonce } from './getNonce'
import { StateManager } from './StateManager'

export class SearchResultsPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: SearchResultsPanel | undefined

  public static readonly viewType = 'codeque-search-results'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly stateManager: StateManager
  private _disposables: vscode.Disposable[] = []

  public static createOrShow(
    extensionUri: vscode.Uri,
    stateManager: StateManager,
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (SearchResultsPanel.currentPanel) {
      SearchResultsPanel.currentPanel._panel.reveal(column)

      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      SearchResultsPanel.viewType,
      'CodeQue',
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'dist-webviews'),
        ],
      },
    )

    panel.iconPath = vscode.Uri.joinPath(extensionUri, 'media', 'logoShort.png')

    panel.onDidChangeViewState((ev) => {
      eventBusInstance.dispatch(
        'results-panel-visibility',
        ev.webviewPanel.visible,
      )
    })

    SearchResultsPanel.currentPanel = new SearchResultsPanel(
      panel,
      extensionUri,
      stateManager,
    )
  }

  public static kill() {
    SearchResultsPanel.currentPanel?.dispose()
    SearchResultsPanel.currentPanel = undefined
  }

  // This is perhaps to force recreate
  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    stateManager: StateManager,
  ) {
    SearchResultsPanel.currentPanel = new SearchResultsPanel(
      panel,
      extensionUri,
      stateManager,
    )
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    stateManager: StateManager,
  ) {
    this._panel = panel
    this._extensionUri = extensionUri
    this.stateManager = stateManager
    const webview = this._panel.webview
    // Set the webview's initial html content
    this._update()

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    const postMessage = (message: any) => webview.postMessage(message)

    eventBusInstance.addTransport(postMessage)

    // // Handle messages from the webview
    webview.onDidReceiveMessage(
      eventBusInstance.pipeFromWebview,
      null,
      this._disposables,
    )

    eventBusInstance.addListener(
      'results-panel-opened',
      this.sendInitialDataToWebview,
    )

    eventBusInstance.addListener('set-query-in-settings', this.setQueryData)
    eventBusInstance.addListener('open-file', this.openFile)

    eventBusInstance.addListenerOnce('results-panel-opened', () => {
      eventBusInstance.dispatch('start-search')
    })

    const unsubscribeFromEventBus = () => {
      eventBusInstance.removeListener(
        'results-panel-opened',
        this.sendInitialDataToWebview,
      )

      eventBusInstance.removeListener(
        'set-query-in-settings',
        this.setQueryData,
      )

      eventBusInstance.removeListener('open-file', this.openFile)

      eventBusInstance.removeTransport(postMessage)
    }

    this._disposables.push(new vscode.Disposable(unsubscribeFromEventBus))
  }

  private setQueryData = (query: string | null) => {
    this.stateManager.setState({ query: query ?? '' })
  }

  private sendInitialDataToWebview = () => {
    eventBusInstance.dispatch('initial-settings', this.stateManager.getState())
  }

  private openFile = ({
    filePath,
    location,
  }: {
    filePath: string
    location: Match['loc']
  }) => {
    const setting: vscode.Uri = vscode.Uri.parse(filePath)

    vscode.workspace.openTextDocument(setting).then(
      (textDoc: vscode.TextDocument) => {
        const startPos = new vscode.Position(
          location.start.line - 1, // API has 0-based indexes
          location.start.column,
        )
        const endPos = new vscode.Position(
          location.end.line - 1, // API has 0-based indexes
          location.end.column,
        )
        const selection = new vscode.Range(startPos, endPos)

        return vscode.window.showTextDocument(textDoc, { selection })
      },
      (error: any) => {
        console.error('error opening file', filePath)
        console.error(error)
      },
    )
  }

  public dispose() {
    SearchResultsPanel.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()

      if (x) {
        x.dispose()
      }
    }

    vscode.commands.executeCommand('workbench.view.explorer')
  }

  private async _update() {
    const webview = this._panel.webview

    webview.html = this._getHtmlForWebview(webview)
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'dist-webviews',
        'searchResultsPanel.js',
      ),
    )

    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'),
    )
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'),
    )

    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'compiled/swiper.css'),
    )

    const nonce = getNonce()

    return dedent`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${stylesResetUri}" rel="stylesheet">
          <link href="${stylesMainUri}" rel="stylesheet">
        </head>
        <body>
          <div id="root"></div>
          <script src="${scriptUri}" nonce="${nonce}">
        </body>
      </html>
    `
  }
}
