import { Match } from '@codeque/core'
import { eventBusInstance } from '../../EventBus'

export const openFile = (data: {
  filePath: string
  locationsToSelect?: Array<Match['loc']>
  locationsToDecorate?: Array<Match['loc']>
}) => {
  eventBusInstance.dispatch('open-file', data)
}
