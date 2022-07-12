import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
//@ts-ignore - Add typings
const vscode = acquireVsCodeApi()

const Panel = () => {
  const [data, setData] = useState({})

  useEffect(() => {
    vscode.postMessage({ type: 'panel-open' })

    const handleMessage = async (event: any) => {
      const message = event.data
      switch (message.type) {
        case 'settings-changed':
          setData(message.data)
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return (
    <div>
      <h1>Panel !</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

//@ts-ignore
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<Panel />)
