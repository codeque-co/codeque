import { ParserSettings, ParserType } from '../types'

const resolveParserSettings = (parser: string) => () => {
  return require(`./${parser}/settings`).default
}

export const parserSettingsMap: Record<ParserType, () => ParserSettings> = {
  babel: resolveParserSettings('babelParser'),
  'typescript-eslint-parser': resolveParserSettings('typescriptEslintParser'),
  espree: resolveParserSettings('espreeParser'),
  esprima: resolveParserSettings('esprimaParser'),
  'babel-eslint-parser': resolveParserSettings('babelEslintParser'),
}
