// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
;

(function () {
  const vscode = acquireVsCodeApi()

  const el = document.createElement('p')
  el.classList.add('mtk15')
  el.innerText = 'witaj'
  document.body.appendChild(el)

  vscode.postMessage({ type: 'panel-open' })

  window.addEventListener('message', async (event) => {
    const message = event.data
    switch (message.type) {
      case 'settings-changed':
        el.innerText = JSON.stringify(message.data, null, 2)
    }
  })

  console.log('window', window)
  console.log('global', global)
})()
