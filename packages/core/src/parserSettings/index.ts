import { ParserSettings, ParserType } from '../types'
import { babelParserSettings } from './babelParser/settings'
import { typescriptEslintParserSettings } from './typescriptEslintParser/settings'
import { esprimaParserSettings } from './esprimaParser/settings'

typescriptEslintParserSettings
export const parserSettingsMap: Record<ParserType, ParserSettings> = {
  babel: babelParserSettings,
  'typescript-eslint': typescriptEslintParserSettings,
  esprima: esprimaParserSettings,
}
