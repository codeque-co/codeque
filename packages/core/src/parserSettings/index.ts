import { ParserSettings, ParserType } from '../types'
import { babelParserSettings } from './babelParser/settings'

export const parserSettingsMap: Record<ParserType, ParserSettings> = {
  babel: babelParserSettings,
  'typescript-eslint': null as unknown as ParserSettings,
}
