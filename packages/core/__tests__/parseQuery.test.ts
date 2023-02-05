import { getUniqueTokens, extractQueryNode } from '../src/parseQuery'
import { getParserSettings } from './utils'

describe('parse query', () => {
  const parserSettings = getParserSettings()

  it('should get unique tokens', () => {
    const queryCode = `
      require('some$$wildcard$$string')
      const a = 'b'
      const alpha = 'beta'
      type MyType = boolean
      123;
      {
        {
          () => {
            0x0;
            return 'test'
          }
        }
      }
    `
    const { queryNode } = extractQueryNode(
      parserSettings.parseCode(queryCode),
      parserSettings,
    )

    const uniqueTokens = [...getUniqueTokens(queryNode, false, parserSettings)]

    expect(uniqueTokens).toMatchObject([
      'require',
      'some',
      'wildcard',
      'string',
      'alpha',
      'beta',
      'MyType',
      '123',
      'test',
    ])
  })
})
