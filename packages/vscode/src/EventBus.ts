import { StateShape } from './StateManager'
import { Match } from '@codeque/core'
import { ExtendedSearchResults } from './types'

type EventTypes = {
  'sidebar-open': null
  'panel-open': null
  'set-settings': Partial<StateShape>
  'initial-settings': StateShape
  'open-file': {
    filePath: string
    location: Match['loc']
  }
  'search-start': null
  'have-results': {
    results: ExtendedSearchResults
    time: number
    files: string[]
  }
  'settings-changed': StateShape
  'set-query': string | null
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
    'sidebar-open': [],
    'panel-open': [],
    'initial-settings': [],
    'set-settings': [],
    'set-query': [],
    'settings-changed': [],
    'open-file': [],
    'search-start': [],
    'have-results': []
  }
  public env = 'extension'

  addTransport = (sendFn: (data: any) => void) => {
    console.log(this.env, 'addTransport')
    this.transports.push(sendFn)
  }

  removeTransport = (sendFn: (data: any) => void) => {
    console.log(this.env, 'removeTransport')

    this.transports = this.transports.filter(
      (transportFn) => sendFn !== transportFn
    )
  }

  addListener = <T extends EventType>(
    eventType: T,
    callback: (data: EventTypes[T]) => void
  ) => {
    console.log(this.env, 'addListener')

    this.listeners[eventType].push(callback)
  }

  removeListener = <T extends EventType>(
    eventType: T,
    callback: (data: EventTypes[T]) => void
  ) => {
    console.log(this.env, 'removeListener')

    this.listeners[eventType] = this.listeners[eventType].filter(
      (fn) => fn !== callback
    )
  }

  dispatch = async <T extends EventType>(
    eventType: T,
    data?: EventTypes[T],
    dispatchThroughTransports = true
  ) => {
    console.log(this.env, 'dispatch', eventType)
    try {
      await Promise.all(
        this.listeners[eventType].map((callback) => callback(data))
      )
    } catch (e) {
      console.log(this.env, 'internal dispatch error', e)
    }

    if (dispatchThroughTransports) {
      const eventWrappedForTransport = JSON.stringify({
        metaType: 'event-bus-event',
        metaEvent: {
          type: eventType,
          data
        }
      })

      console.log(this.env, 'transports', this.transports.length)

      try {
        await Promise.all(
          this.transports.map((sendFn) => {
            console.log(this.env, 'sendFn', sendFn)

            if (sendFn) {
              return sendFn(eventWrappedForTransport)
            }

            // return sendFn(eventWrappedForTransport)
            return
          })
        )
      } catch (e) {
        console.log(
          this.env,
          'transports dispatch error',
          e,
          'event-type',
          eventType,
          'data',
          data
        )
      }
    }
  }

  pipeFromWebview = (maybeEventStr: string) => {
    console.log(this.env, 'pipeFromWebview')
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
      console.log(this.env, 'pipeFromWebview failed', e)
    }
  }

  pipeFromWindowMessage = (message: { data: string }) => {
    console.log(this.env, 'pipeFromWindowMessage')
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
      console.log(this.env, 'pipeFromWindowMessage failed', e)
    }
  }
}

export const eventBusInstance = new EventBus()
