import { HardStopFlag } from './types'

type StopListener = () => void

export const createHardStopFlag = () => {
  const hardStopFlag = {
    internalStopSearch: false,
    get stopSearch() {
      return this.internalStopSearch
    },
    set stopSearch(val) {
      this.internalStopSearch = val

      if (val === true) {
        this.listeners.forEach((listener) => listener())
      }
    },
    listeners: [] as StopListener[],
    addStopListener: function (externalListenerFunction: StopListener) {
      this.listeners.push(externalListenerFunction)
    },
    destroy: function () {
      this.listeners = []
    },
  }

  return hardStopFlag as HardStopFlag
}
