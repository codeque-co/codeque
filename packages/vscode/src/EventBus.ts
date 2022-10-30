import { StateShape } from './StateManager'
import { Match } from '@codeque/core'
import { ExtendedSearchResults } from './types'

type ResultsEventData = {
  results: ExtendedSearchResults
  time: number
  files: string[]
}

type EventTypes = {
  'sidebar-panel-opened': null
  'results-panel-opened': null
  'results-panel-visibility': boolean
  'show-results-panel': null
  'set-settings': Partial<StateShape>
  'initial-settings': StateShape
  'open-file': {
    filePath: string
    location: Match['loc']
  }
  'open-search-from-selection': null
  'start-search': null
  'search-started': string
  'have-results': ResultsEventData
  'have-partial-results': ResultsEventData
  'settings-changed': Partial<StateShape>
  'set-query-in-settings': string | null
  'set-query-on-ui': string
  'stop-search': null
}

type EventObjectTypes<T extends keyof EventTypes> = {
  type: T
  data: EventTypes[T]
}

type EventType = keyof EventTypes

type MaybeEvent = {
  metaType?: string
  metaEvent?: EventObjectTypes<EventType>
}

export class EventBus {
  private transports: Array<(data: any) => void> = []
  private listeners: Record<EventType, Array<(data: any) => void>> = {
    'sidebar-panel-opened': [],
    'results-panel-opened': [],
    'show-results-panel': [],
    'results-panel-visibility': [],
    'initial-settings': [],
    'set-settings': [],
    'set-query-in-settings': [],
    'set-query-on-ui': [],
    'settings-changed': [],
    'open-file': [],
    'open-search-from-selection': [],
    'start-search': [],
    'search-started': [],
    'have-results': [],
    'have-partial-results': [],
    'stop-search': [],
  }
  public env = 'extension'

  addTransport = (sendFn: (data: any) => void) => {
    this.transports.push(sendFn)
  }

  removeTransport = (sendFn: (data: any) => void) => {
    this.transports = this.transports.filter(
      (transportFn) => sendFn !== transportFn,
    )
  }

  addListener = <T extends EventType>(
    eventType: T,
    callback: (data: EventTypes[T]) => void,
  ) => {
    this.listeners[eventType].push(callback)
  }

  addListenerOnce = <T extends EventType>(
    eventType: T,
    callback: (data: EventTypes[T]) => void,
  ) => {
    const onceHandler = (data: EventTypes[T]) => {
      callback(data)
      this.removeListener(eventType, onceHandler)
    }

    this.listeners[eventType].push(onceHandler)
  }

  removeListener = <T extends EventType>(
    eventType: T,
    callback: (data: EventTypes[T]) => void,
  ) => {
    this.listeners[eventType] = this.listeners[eventType].filter(
      (fn) => fn !== callback,
    )
  }

  dispatch = async <T extends EventType>(
    eventType: T,
    data?: EventTypes[T],
    dispatchThroughTransports = true,
  ) => {
    // console.log(`dispatch:${this.env}`, eventType, data)
    try {
      await Promise.all(
        this.listeners[eventType].map((callback) => callback(data)),
      )
    } catch (e) {
      console.error(this.env, 'internal dispatch error', e)
    }

    if (dispatchThroughTransports) {
      const eventWrappedForTransport = JSON.stringify({
        metaType: 'event-bus-event',
        metaEvent: {
          type: eventType,
          data,
        },
      })

      try {
        await Promise.all(
          this.transports.map((sendFn) => {
            if (sendFn) {
              return sendFn(eventWrappedForTransport)
            }

            return
          }),
        )
      } catch (e) {
        console.error(
          this.env,
          'transports dispatch error',
          e,
          'event-type',
          eventType,
          'data',
          data,
        )
      }
    }
  }

  pipeFromWebview = (maybeEventStr: string) => {
    try {
      const maybeEvent = JSON.parse(maybeEventStr) as MaybeEvent

      if (
        maybeEvent?.metaType === 'event-bus-event' &&
        maybeEvent.metaEvent &&
        maybeEvent.metaEvent?.type !== null
      ) {
        const event = maybeEvent.metaEvent
        this.dispatch(event.type, event?.data, false)
      }
    } catch (e) {
      console.error(this.env, 'pipeFromWebview failed', e)
    }
  }

  pipeFromWindowMessage = (message: { data: string }) => {
    try {
      const maybeEvent = JSON.parse(message?.data) as MaybeEvent

      if (
        maybeEvent &&
        maybeEvent?.metaType === 'event-bus-event' &&
        maybeEvent.metaEvent &&
        maybeEvent.metaEvent?.type !== null
      ) {
        const event = maybeEvent.metaEvent
        this.dispatch(event?.type, event?.data, false)
      }
    } catch (e) {
      console.error(this.env, 'pipeFromWindowMessage failed', e)
    }
  }
}

export const eventBusInstance = new EventBus()
