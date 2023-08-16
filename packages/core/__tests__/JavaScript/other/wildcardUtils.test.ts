import { PoorNodeType, WildcardMeta } from '../../../src/types'
import { createWildcardUtils } from '../../../src/wildcardUtilsFactory'
import { regExpTest } from '../../../src/utils'

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

  it('should remove identifier ref from wildcard', () => {
    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$$_ref1'),
    ).toBe('$$$')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$_ref1'),
    ).toBe('$$')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$something'),
    ).toBe('$$something')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$_something'),
    ).toBe('$$')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('asd$$_ref'),
    ).toBe('asd$$')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('asd$$_ref_bcd'),
    ).toBe('asd$$bcd')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$_ref_bcd'),
    ).toBe('$$bcd')

    // should remove aliases for multiple wildcards
    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName(
        'asd$$_ref_bcd$$_efg_ed$$_ac',
      ),
    ).toBe('asd$$bcd$$ed$$')

    // should not remove if ref is another wildcard
    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$$_$$'),
    ).toBe('$$$_$$')

    // should not remove ref from invalid wildcard (one wildcard after another)
    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName(
        'New$$_ref1_$$_ref2_Value',
      ),
    ).toBe('New$$_ref1_$$_ref2_Value')
  })

  it('should not remove if ref is in the middle of string', () => {
    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$_notRef$$'),
    ).toBe('$$_notRef$$')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$$_notRef$$'),
    ).toBe('$$$_notRef$$')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$notRef_$$'),
    ).toBe('$$notRef_$$')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$$notRef_$$'),
    ).toBe('$$$notRef_$$')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$_notRef_$$'),
    ).toBe('$$_notRef_$$')

    expect(
      wildcardUtils.removeWildcardAliasesFromIdentifierName('$$$_notRef_$$'),
    ).toBe('$$$_notRef_$$')
  })

  describe('Classify string and string with wildcard', () => {
    const valid: { value: string; wildcard: string }[] = [
      { value: '$$', wildcard: '$$' },
      { value: '$$$', wildcard: '$$$' },
      { value: '$$_ref', wildcard: '$$' },
      { value: '$$_ref_', wildcard: '$$' },
      { value: '$$$_ref', wildcard: '$$$' },
      { value: 'pre-$$-post', wildcard: 'pre-$$-post' },
      { value: 'pre-$$$-post', wildcard: 'pre-$$$-post' },
      { value: 'pre-$$$_alias_-post', wildcard: 'pre-$$$-post' },
    ]
    const invalid = ['_ref', 'id', '', '$']

    it.each(valid)(
      'Should match string wildcard in %s',
      ({ value, wildcard }) => {
        const valueWithRemovedWildcard =
          wildcardUtils.removeWildcardAliasesFromStringLiteral(value)

        expect(regExpTest(wildcardUtils.anyStringWildcardRegExp, value)).toBe(
          true,
        )

        expect(valueWithRemovedWildcard).toBe(wildcard)
      },
    )

    it.each(invalid)(
      'Should not recognise string wildcard in %s',
      (str: string) => {
        expect(regExpTest(wildcardUtils.anyStringWildcardRegExp, str)).toBe(
          false,
        )
      },
    )
  })

  describe('Get wildcard info from identifier node name', () => {
    it('should get not aliased wildcard info in identifier without additional string parts', () => {
      const identifierName = '$$'
      const wildcardInfo =
        wildcardUtils.getIdentifierWildcardsFromString(identifierName)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'identifier',
          wildcardWithAlias: '$$',
          wildcardWithoutAlias: '$$',
          wildcardAlias: null,
        },
      ])
    })

    it('should get not aliased wildcard info in identifier with additional string parts', () => {
      const identifierName = 'pre$$post'
      const wildcardInfo =
        wildcardUtils.getIdentifierWildcardsFromString(identifierName)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'identifier',
          wildcardWithAlias: '$$',
          wildcardWithoutAlias: '$$',
          wildcardAlias: null,
        },
      ])
    })

    it('should get aliased wildcard info in identifier without additional string parts', () => {
      const identifierName = '$$_ref'
      const identifierName2 = '$$_ref_'

      const wildcardInfo1 =
        wildcardUtils.getIdentifierWildcardsFromString(identifierName)
      const wildcardInfo2 =
        wildcardUtils.getIdentifierWildcardsFromString(identifierName2)

      expect(wildcardInfo1).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'identifier',
          wildcardWithAlias: '$$_ref',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref',
        },
      ])

      expect(wildcardInfo2).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'identifier',
          wildcardWithAlias: '$$_ref_',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref',
        },
      ])
    })

    it('should get aliased wildcard info in identifier with additional string parts', () => {
      const identifierName = 'pre$$_refpost'
      const identifierName2 = 'pre$$_ref_post'

      const wildcardInfo1 =
        wildcardUtils.getIdentifierWildcardsFromString(identifierName)
      const wildcardInfo2 =
        wildcardUtils.getIdentifierWildcardsFromString(identifierName2)

      expect(wildcardInfo1).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'identifier',
          wildcardWithAlias: '$$_refpost',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'refpost',
        },
      ])

      expect(wildcardInfo2).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'identifier',
          wildcardWithAlias: '$$_ref_',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref',
        },
      ])
    })

    it('should get multiple aliased wildcards info in identifier with additional string parts', () => {
      const identifierName = 'pre$$_ref1_post$$_ref2'

      const wildcardInfo =
        wildcardUtils.getIdentifierWildcardsFromString(identifierName)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'identifier',
          wildcardWithAlias: '$$_ref1_',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref1',
        },
        {
          wildcardType: 'identifier',
          wildcardWithAlias: '$$_ref2',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref2',
        },
      ])
    })

    it('should get identifier wildcard alias with camelCase name', () => {
      const identifierName = '$$_someRef'

      const wildcardInfo =
        wildcardUtils.getIdentifierWildcardsFromString(identifierName)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'identifier',
          wildcardWithAlias: '$$_someRef',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'someRef',
        },
      ])
    })

    it('should get nodes tree wildcard alias with camelCase name', () => {
      const identifierName = '$$$_someRef'

      const wildcardInfo =
        wildcardUtils.getIdentifierWildcardsFromString(identifierName)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'nodeTree',
          wildcardWithAlias: '$$$_someRef',
          wildcardWithoutAlias: '$$$',
          wildcardAlias: 'someRef',
        },
      ])
    })
  })

  describe('Get wildcard info from string literal', () => {
    it('should get not aliased optional string wildcard info in string without additional parts', () => {
      const stringContent = '$$'
      const wildcardInfo =
        wildcardUtils.getStringWildcardsFromString(stringContent)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$',
          wildcardWithoutAlias: '$$',
          wildcardAlias: null,
        },
      ])
    })

    it('should get not aliased string wildcard info in string with additional parts', () => {
      const stringContent = 'pre$$post'
      const wildcardInfo =
        wildcardUtils.getStringWildcardsFromString(stringContent)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$',
          wildcardWithoutAlias: '$$',
          wildcardAlias: null,
        },
      ])
    })

    it('should get aliased optional string wildcard info in string without additional parts', () => {
      const stringContent = '$$_ref'
      const stringContent2 = '$$_ref_'

      const wildcardInfo1 =
        wildcardUtils.getStringWildcardsFromString(stringContent)
      const wildcardInfo2 =
        wildcardUtils.getStringWildcardsFromString(stringContent2)

      expect(wildcardInfo1).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$_ref',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref',
        },
      ])

      expect(wildcardInfo2).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$_ref_',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref',
        },
      ])
    })

    it('should get aliased optional string wildcard info in string with additional parts', () => {
      const stringContent = 'pre$$_refpost'
      const stringContent2 = 'pre$$_ref_post'

      const wildcardInfo1 =
        wildcardUtils.getStringWildcardsFromString(stringContent)
      const wildcardInfo2 =
        wildcardUtils.getStringWildcardsFromString(stringContent2)

      expect(wildcardInfo1).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$_refpost',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'refpost',
        },
      ])

      expect(wildcardInfo2).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$_ref_',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref',
        },
      ])
    })

    it('should get multiple optional aliased wildcards info in string with additional parts', () => {
      const stringContent = 'pre$$_ref1_post$$_ref2'

      const wildcardInfo =
        wildcardUtils.getStringWildcardsFromString(stringContent)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$_ref1_',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref1',
        },
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$_ref2',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref2',
        },
      ])
    })

    it('should get optional string wildcard alias with camelCase name', () => {
      const stringContent = '$$_someRef'

      const wildcardInfo =
        wildcardUtils.getStringWildcardsFromString(stringContent)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$_someRef',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'someRef',
        },
      ])
    })

    it('should get required string wildcard alias with camelCase name', () => {
      const stringContent = '$$$_someRef'

      const wildcardInfo =
        wildcardUtils.getStringWildcardsFromString(stringContent)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$$_someRef',
          wildcardWithoutAlias: '$$$',
          wildcardAlias: 'someRef',
        },
      ])
    })

    it('should get optional and required aliased wildcards info in string with additional parts', () => {
      const stringContent = 'pre$$_ref1_post$$$_ref2'

      const wildcardInfo =
        wildcardUtils.getStringWildcardsFromString(stringContent)

      expect(wildcardInfo).toMatchObject<WildcardMeta[]>([
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$_ref1_',
          wildcardWithoutAlias: '$$',
          wildcardAlias: 'ref1',
        },
        {
          wildcardType: 'string',
          wildcardWithAlias: '$$$_ref2',
          wildcardWithoutAlias: '$$$',
          wildcardAlias: 'ref2',
        },
      ])
    })
  })
})
