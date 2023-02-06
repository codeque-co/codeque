import { typescriptEslintParserSettings } from '../typescriptEslintParser/settings'
import { ParserSettings, PoorNodeType } from '../../types'
import esprima, { parseModule } from 'esprima'

export const esprimaParserSettings: ParserSettings = {
  ...typescriptEslintParserSettings,
  parseCode: (code, filePath = '') => {
    const settings: esprima.ParseOptions = {
      jsx: true,
      range: true,
      loc: true,
    }
    const maybeWrappedJSON = /\.json$/.test(filePath) ? `(${code})` : code

    const ast = parseModule(maybeWrappedJSON, settings)

    return ast as unknown as PoorNodeType
  },
}
