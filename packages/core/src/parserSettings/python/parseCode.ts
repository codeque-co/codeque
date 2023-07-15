import Parser from 'web-tree-sitter'
import { collectAstFromTree } from '../../treeSitterUtils'

const defineRawValueForNodeTypes = ['identifier', 'integer', 'string']

const parserModule = (() => {
  let parser: Parser | null = null
  let parserInitError: Error | null = null
  const nodeTypeToFieldsCache: Record<string, string[]> = {}

  const init = () => {
    return Parser.init()
      .then(async () => {
        const Python = await Parser.Language.load(
          __dirname + '/tree-sitter-python.wasm',
        )

        const localParser = new Parser()

        localParser.setLanguage(Python)
        parser = localParser
      })
      .catch((error) => {
        console.error('Parser init error', error)
        parser = null
        parserInitError = error
      })
  }

  const parse = (code: string) => {
    if (parser === null) {
      throw new Error('Parser not ready')
    }

    if (parserInitError) {
      throw parserInitError
    }

    const tree = parser.parse(code, undefined)
    const ast = collectAstFromTree(
      tree,
      code,
      nodeTypeToFieldsCache,
      defineRawValueForNodeTypes,
    )

    tree.delete()

    return ast
  }

  return { init, parse }
})()

export const parserInitPromise = parserModule.init()

export function parseCode(code: string) {
  return parserModule.parse(code)
}
