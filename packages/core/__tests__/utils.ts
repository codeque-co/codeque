import {
  compareCode as compareCodeBase,
  compareAst as compareAstBase,
} from '../src/astUtils'
import { PoorNodeType } from '../src/types'
import { parserSettingsMap } from '../src/parserSettings/index'
import path from 'path'
import { testParserTypeOverride } from '../src/testOnlyConfig'

export const parserType = testParserTypeOverride

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

export const compareAst = (astA: PoorNodeType, astB: PoorNodeType) => {
  const parserSettings = getParserSettings()

  return compareAstBase(astA, astB, parserSettings)
}

export const compareAstToCode = (ast: PoorNodeType, code: string) => {
  const parserSettings = getParserSettings()

  const astFromCode = parserSettings.unwrapExpressionStatement(
    parserSettings.getProgramBodyFromRootNode(
      parserSettings.parseCode(code),
    )[0],
  )

  return compareAstBase(ast, astFromCode, parserSettings)
}

export const fixturesPath = path.resolve(
  process.cwd(),
  '__tests__/__fixtures__',
)

export const fixturesOtherPath = path.resolve(
  process.cwd(),
  '__tests__/__fixturesOther__',
)
