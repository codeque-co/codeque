import ReactDOM from 'react-dom/client'
import { useEffect, useCallback, useState } from 'react'
import { Providers } from '../components/Providers'
import { SearchSettings } from './components/SearchSettings'
import { eventBusInstance } from '../../EventBus'
import { StateShape } from '../../StateManager'
//@ts-ignore - Add typings
const vscode = acquireVsCodeApi()

const Sidebar = () => {
  const [resultsPanelVisible, setResultsPanelVisible] = useState(true)
  const [initialSettings, setInitialSettings] = useState<StateShape | null>(
    null,
  )

  const setSettings = useCallback((settings: Partial<StateShape>) => {
    eventBusInstance.dispatch('set-settings', settings)
    eventBusInstance.dispatch('start-search')
  }, [])

  const handleInitialSettings = useCallback((data: Partial<StateShape>) => {
    setInitialSettings(
      (prevSettings) => ({ ...prevSettings, ...data } as StateShape),
    )
  }, [])

  const handleResultsPanelVisibilityChange = useCallback((data: boolean) => {
    setResultsPanelVisible(data)
  }, [])

  useEffect(() => {
    eventBusInstance.env = 'sidebar'
    window.addEventListener('message', eventBusInstance.pipeFromWindowMessage)
    const postMessage = (...args: any[]) => vscode.postMessage(...args)
    eventBusInstance.addTransport(postMessage)

    setTimeout(() => {
      eventBusInstance.dispatch('sidebar-panel-opened')
    }, 0)

    return () => {
      eventBusInstance.removeTransport(postMessage)

      window.removeEventListener(
        'message',
        eventBusInstance.pipeFromWindowMessage,
      )
    }
  }, [])

  useEffect(() => {
    eventBusInstance.addListener('initial-settings', handleInitialSettings)
    eventBusInstance.addListener('settings-changed', handleInitialSettings)

    return () => {
      eventBusInstance.removeListener('initial-settings', handleInitialSettings)
      eventBusInstance.removeListener('settings-changed', handleInitialSettings)
    }
  }, [handleInitialSettings])

  useEffect(() => {
    eventBusInstance.addListener(
      'results-panel-visibility',
      handleResultsPanelVisibilityChange,
    )

    return () => {
      eventBusInstance.removeListener(
        'results-panel-visibility',
        handleResultsPanelVisibilityChange,
      )
    }
  }, [handleResultsPanelVisibilityChange])

  return (
    <Providers>
      {initialSettings && (
        <SearchSettings
          initialSettings={initialSettings}
          setSettings={setSettings}
          resultsPanelVisible={resultsPanelVisible}
        />
      )}
    </Providers>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<Sidebar />)
