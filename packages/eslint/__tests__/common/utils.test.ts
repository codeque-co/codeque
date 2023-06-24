import { extractParserNameFromResolvedPath } from '../../src/utils'

it('should extract parser name from file path', () => {
  const parserWithOrg = '@typescript-eslint/parser'
  const parserWithoutOrg = 'esprima'

  const parserPathWithOrg =
    '/some/path/to/project/node_modules/@typescript-eslint/parser/dist/index.js'

  const parserPathWithoutOrg =
    '/some/path/to/project/node_modules/esprima/dist/index.js'

  expect(extractParserNameFromResolvedPath(parserPathWithOrg)).toBe(
    parserWithOrg,
  )

  expect(extractParserNameFromResolvedPath(parserPathWithoutOrg)).toBe(
    parserWithoutOrg,
  )
})
