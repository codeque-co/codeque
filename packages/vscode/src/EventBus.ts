import { SearchStateShape } from './SearchStateManager'
import { Match, SearchInFileError } from '@codeque/core'
import { Banner, ExtendedSearchResults } from './types'
import { UserStateShape } from './UserStateManager'

type ResultsEventData = {
  results: ExtendedSearchResults
  time: number
  files: string[]
  isWorkspace: boolean
}

type EventTypes = {
  'sidebar-panel-opened': null
  'results-panel-opened': null
  'results-panel-visibility': boolean
  'show-results-panel': null
  'set-search-settings': Partial<SearchStateShape>
  'initial-search-settings': SearchStateShape
  'search-settings-changed': Partial<SearchStateShape>
  'set-user-settings': Partial<UserStateShape>
  'initial-user-settings': UserStateShape
  'user-settings-changed': Partial<UserStateShape>
  'open-file': {
    filePath: string
    locationsToSelect?: Array<Match['loc']>
    locationsToDecorate?: Array<Match['loc']>
  }
  'open-search-from-selection': null
  'start-search': null
  'search-started': string
  'have-results': ResultsEventData
  'have-partial-results': ResultsEventData
  'set-query-in-settings': string | null
  'set-replacement-in-settings': string | null
  'set-query-on-ui': string
  'stop-search': null
  'start-replace': null
  'replace-started': null
  'replace-progress': number | null
  'replace-finished': { time: number }
  'replace-errors': { errors: Array<SearchInFileError> }
  'search-progress': number | null
  'fetch:banners:start': null
  'fetch:banners:response': Banner[]
  'banner:close': string
  'banner:clicked-link': string
  'pro-modal:closed': null
  'pro-modal:subscribe_clicked': null
  'pro-modal:twitter_handler_clicked': null
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
    'initial-search-settings': [],
    'set-search-settings': [],
    'search-settings-changed': [],
    'set-query-in-settings': [],
    'set-query-on-ui': [],
    'open-file': [],
    'open-search-from-selection': [],
    'start-search': [],
    'search-started': [],
    'have-results': [],
    'have-partial-results': [],
    'stop-search': [],
    'replace-finished': [],
    'replace-started': [],
    'replace-errors': [],
    'start-replace': [],
    'set-replacement-in-settings': [],
    'replace-progress': [],
    'search-progress': [],
    'set-user-settings': [],
    'initial-user-settings': [],
    'user-settings-changed': [],
    'fetch:banners:start': [],
    'fetch:banners:response': [],
    'banner:close': [],
    'banner:clicked-link': [],
    'pro-modal:closed': [],
    'pro-modal:subscribe_clicked': [],
    'pro-modal:twitter_handler_clicked': [],
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
    if (process.env.NODE_ENV !== 'production') {
      //eslint-disable-next-line
      console.log('event', eventType, data)
    }

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
