import { Match } from '@codeque/core'
import { eventBusInstance } from '../../EventBus'

export const openFile = (data: {
  filePath: string
  location?: Match['loc']
}) => {
  eventBusInstance.dispatch('open-file', data)
}
