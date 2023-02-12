export { default as searchInStrings } from './searchInStrings'
export { searchMultiThread } from './searchMultiThread'
export { searchInFileSystem } from './searchInFs'

export { getMode, groupMatchesByFile } from './utils'
export { parseQueries } from './parseQuery'
export {
  getFilesList,
  filterIncludeExclude,
  extensionTester,
  typeScriptFamilyExtensionTester,
  pathToPosix,
  filterExtensions,
} from './getFilesList'
export { createHardStopFlag } from './hardStopFlag'
export * from './types'

/* FOR INTERNAL USE ONLY */
import { parserSettingsMap } from './parserSettings'
import { shallowSearch } from './searchStages/shallowSearch'
import { getMatchFromNode, getVisitorKeysForQueryNodeType } from './astUtils'
import { validateMatch } from './searchStages/validateMatch'

export const __internal = {
  parserSettingsMap,
  shallowSearch,
  getMatchFromNode,
  validateMatch,
  getVisitorKeysForQueryNodeType,
}
