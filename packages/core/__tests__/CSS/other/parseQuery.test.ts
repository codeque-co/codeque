import { getUniqueTokens, extractQueryNode } from '../../../src/parseQuery'
import { getParserSettings } from '../../utils'
import { PoorNodeType } from '../../../src/types'

describe('parse query', () => {
  const parserSettings = getParserSettings()

  const { parseCode } = parserSettings

  const preprocessQueryCode = parserSettings.preprocessQueryCode as (
    s: string,
  ) => string

  const postprocessQueryNode = parserSettings.postprocessQueryNode as (
    node: PoorNodeType,
  ) => PoorNodeType

  it('should get unique tokens', () => {
    const queryCode = `
      p, .class {
        width: 120px;
        background-color: $$;
        height: 0x0%;
      }
    `

    const { queryNode } = extractQueryNode(
      postprocessQueryNode(parseCode(preprocessQueryCode(queryCode))),
      parserSettings,
    )

    const uniqueTokens = [...getUniqueTokens(queryNode, false, parserSettings)]

    expect(uniqueTokens).toMatchObject([
      'class',
      'width',
      'background-color',
      'height',
    ])
  })
})
