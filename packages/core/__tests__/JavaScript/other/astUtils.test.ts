import { createWildcardUtils } from '../../../src/wildcardUtilsFactory'
import { PoorNodeType } from '../../../src/types'
import { sortByLeastIdentifierStrength } from '../../../src/astUtils'

describe('AST utils', () => {
  const getIdentifierNodeName = (node: PoorNodeType) => node.name as string
  const getNodeType = (node: PoorNodeType) => node.type as string

  const identifierTypes: string[] = ['Identifier']
  const numericWildcard = '0x0'
  const wildcardChar = '$'
  const wildcardUtils = createWildcardUtils(
    identifierTypes,
    numericWildcard,
    wildcardChar,
    getIdentifierNodeName,
    getNodeType,
  )

  const idNode = (name: string) => ({ type: 'Identifier', name })

  it('should sort identifiers by least strength', () => {
    const identifiersList: PoorNodeType[] = [
      idNode('$$'),
      idNode('oooo'),
      idNode('foo'),
      idNode('$$$'),
      idNode('sdf$$_ref1_asd'),
      { type: 'literal', value: 4 },
      idNode('$$_ref1'),
      idNode('$$_ref1_asd'),
      { type: 'literal', value: 'asd' },
    ]

    const sortedArr = [...identifiersList].sort((a, b) =>
      sortByLeastIdentifierStrength(a, b, wildcardUtils, getIdentifierNodeName),
    )

    expect(sortedArr.map(({ name, value }) => name || value)).toMatchObject([
      'oooo',
      'foo',
      4,
      'asd',
      'sdf$$_ref1_asd',
      '$$_ref1_asd',
      '$$',
      '$$_ref1',
      '$$$',
    ])
  })
})
