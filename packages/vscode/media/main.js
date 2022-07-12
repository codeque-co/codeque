// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
;

(function () {
  const vscode = acquireVsCodeApi()

  console.log('hello there from javascript')
  const el = document.createElement('p')
  el.innerText = 'witaj'
  document.body.appendChild(el)
  vscode.postMessage({ type: 'sidebar-open' })

  vscode.postMessage({
    type: 'set-settings',
    data: {
      mode: 'exact'
    }
  })

  console.log(
    'vscode-tokens-styles',
    document.querySelector('vscode-tokens-styles')
  )
})()
