import { babelParserSettings } from '../src/parserSettings'

import { compareCode as compareCodeBase } from '/astUtils'

export const compareCode = (codeA: string, codeB: string) => {
  return compareCodeBase(codeA, codeB, babelParserSettings)
}
