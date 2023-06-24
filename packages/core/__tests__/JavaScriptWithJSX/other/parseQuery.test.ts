import { getUniqueTokens, extractQueryNode } from '../../../src/parseQuery'
import { getParserSettings } from '../../utils'

describe('parse query', () => {
  const parserSettings = getParserSettings()

  it('should get unique tokens', () => {
    const queryCode = `
      require('some$$wildcard$$string')
      const a = 'b'
      const alpha = 'beta'
      (<SomeJSX/>)
      123;
      pre$$_ref1_post
      $$_ref1_content$$_ref2
      asd$$_invalidRef_$$
      asd$$_invalidRef$$
      {
        {
          () => {
            0x0;
            return 'test'
          }
        }
      }
      f('some$$_ref1_tttt$$_ref2')
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
      'SomeJSX',
      '123',
      'pre',
      'post',
      'content',
      'asd',
      '_invalidRef_',
      '_invalidRef',
      'test',
      // 'some', // only 'tttt' is new
      'tttt',
    ])
  })
})
