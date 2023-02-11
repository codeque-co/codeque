import { compareCode as compareCodeBase } from '/astUtils'
import { ParserType } from '/types'
import { parserSettingsMap } from '../src/parserSettings/index'

const parserType = process.env.TEST_PARSER_TYPE as ParserType

export const getParserSettings = () => {
  if (parserType === undefined) {
    throw new Error('process.env.TEST_PARSER_TYPE not set')
  }

  const parserSettings = parserSettingsMap[parserType]()

  return parserSettings
}

export const compareCode = (codeA: string, codeB: string) => {
  const parserSettings = getParserSettings()

  return compareCodeBase(codeA, codeB, parserSettings)
}
