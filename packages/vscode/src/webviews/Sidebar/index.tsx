import ReactDOM from 'react-dom'
import { useEffect, useState } from 'react'
//@ts-ignore - Add typings
const vscode = acquireVsCodeApi()

const Sidebar = () => {
  useEffect(() => {
    vscode.postMessage({ type: 'sidebar-open' })

    vscode.postMessage({
      type: 'set-settings',
      data: {
        mode: 'exact'
      }
    })
  }, [])

  return (
    <div>
      <h1>Sidebar !</h1>
    </div>
  )
}

//@ts-ignore
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<Sidebar />)
