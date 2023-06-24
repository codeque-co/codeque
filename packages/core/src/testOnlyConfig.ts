import { ParserType } from './types'
type TestSettings = {
  parserType: ParserType
  isTraversal: boolean
}

declare global {
  //eslint-disable-next-line no-var
  var testSettings: TestSettings | undefined
}

export const useTraverseApproachTestOnly = global?.testSettings?.isTraversal
export const testParserTypeOverride = global?.testSettings?.parserType
