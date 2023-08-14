import Parser from 'web-tree-sitter'
import {
  collectAstFromTree,
  getFilePaths,
  getFieldsMeta,
  getTreeSitterWasmPath,
} from '../../treeSitterUtils'

import { TreeSitterNodeFieldsMeta } from '../../types'

const defineRawValueForNodeTypes = [
  'identifier',
  'integer',
  'string_content',
  'float',
]

const getDefaultBasePath = () => {
  return typeof process?.cwd !== 'undefined' ? process.cwd() : '/'
}

export const parserModule = (() => {
  const treeSitterParserName = 'tree-sitter-python'
  let parser: Parser | null = null
  let parserInitError: Error | null = null
  let fieldsMeta: TreeSitterNodeFieldsMeta | null = null

  const filePaths = getFilePaths(treeSitterParserName)

  const init = async (basePathOption?: string | undefined) => {
    if (parser) {
      return
    }

    const basePath = basePathOption ?? getDefaultBasePath()

    return Parser.init({
      locateFile: () =>
        getTreeSitterWasmPath(basePath, filePaths.treeSitterWasm),
    })
      .then(async () => {
        fieldsMeta = await getFieldsMeta(basePath, filePaths.fieldsMeta)
        const Python = await Parser.Language.load(
          getTreeSitterWasmPath(basePath, filePaths.parserWasm),
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

    if (fieldsMeta === null) {
      throw new Error("Couldn't load fields meta")
    }

    if (parserInitError) {
      throw parserInitError
    }

    const tree = parser.parse(code, undefined)

    const ast = collectAstFromTree(
      tree,
      code,
      defineRawValueForNodeTypes,
      fieldsMeta,
    )

    tree.delete()

    return ast ?? { nodeType: 'empty' } // this is to make TS happy, won't happen in real life.
  }

  return { init, parse }
})()

export function parseCode(code: string) {
  return parserModule.parse(code)
}
