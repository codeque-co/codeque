import { createMatchContext } from '../../src/matchContext'

describe('Match context data structure', () => {
  it('should prove creating new match context form other outputs independent data structure', () => {
    const first = createMatchContext()

    first.addIdentifierAlias({
      wildcard: '$$',
      alias: 'ref',
      aliasValue: 'identifier',
    })

    const second = createMatchContext(first.getAllAliases())

    second.addIdentifierAlias({
      wildcard: '$$',
      alias: 'ref2',
      aliasValue: 'identifier2',
    })

    expect(first.getIdentifierAlias('ref')?.aliasValue).toBe('identifier')
    expect(first.getIdentifierAlias('ref2')).toBe(null)

    expect(second.getIdentifierAlias('ref')?.aliasValue).toBe('identifier')
    expect(second.getIdentifierAlias('ref2')?.aliasValue).toBe('identifier2')
  })

  it('should merge one context into another', () => {
    const first = createMatchContext()

    first.addIdentifierAlias({
      wildcard: '$$',
      alias: 'ref',
      aliasValue: 'identifier',
    })

    const second = createMatchContext()

    second.addIdentifierAlias({
      wildcard: '$$',
      alias: 'ref2',
      aliasValue: 'identifier2',
    })

    first.merge(second.getAllAliases())

    expect(first.getIdentifierAlias('ref')?.aliasValue).toBe('identifier')
    expect(first.getIdentifierAlias('ref2')?.aliasValue).toBe('identifier2')
  })
})
