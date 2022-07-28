import dedent from 'dedent'
import * as vscode from 'vscode'
import { getNonce } from './getNonce'
import { StateManager } from './StateManager'
import { eventBusInstance } from './EventBus'
export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView
  _doc?: vscode.TextDocument

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly stateManager: StateManager,
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

    const postMessage = (message: any) =>
      this._view?.webview.postMessage(message)

    //TODO Should we somehow remove it on unmount and remove listeners ?
    eventBusInstance.addTransport(postMessage)

    webviewView.webview.onDidReceiveMessage(eventBusInstance.pipeFromWebview)

    eventBusInstance.addListener('sidebar-panel-opened', () => {
      eventBusInstance.dispatch('show-results-panel')

      eventBusInstance.dispatch(
        'initial-settings',
        this.stateManager.getState(),
      )
    })

    eventBusInstance.addListener('set-settings', (data) => {
      this.stateManager.setState(data)
    })
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'),
    )
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'),
    )

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist-webviews', 'sidebar.js'),
    )
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'compiled/sidebar.css'),
    )

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce()

    return dedent`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${styleResetUri}" rel="stylesheet">
          <link href="${styleVSCodeUri}" rel="stylesheet">
        </head>
        <body>
          <div id="root"></div>
          <script src="${scriptUri}" nonce="${nonce}">
        </body>
      </html>
    `
  }
}
