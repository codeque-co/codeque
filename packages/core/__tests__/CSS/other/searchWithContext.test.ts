import { searchInStrings } from '../../../src/searchInStrings'

describe('Wildcard queries', () => {
  it('Should match wildcard ref between class rules', () => {
    const fileContent = `
      .firstClass {
        background-color: red;
      }

      .otherClassName {
        display: none;
      }
    `
    const queries = [
      `
        .first$$_classRef {}

        .other$$_classRef_Name {}
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      caseInsensitive: true,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)

    expect(matches[0].aliases.stringAliasesMap['classRef'].aliasValue).toBe(
      'Class',
    )
  })

  it('Should not match wildcard ref between class rules when they are different', () => {
    const fileContent = `
      .firstClass {
        background-color: red;
      }

      .otherXXXXName {
        display: none;
      }
    `
    const queries = [
      `
        .first$$_classRef {}

        .other$$_classRef_Name {}
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      caseInsensitive: true,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(0)
  })

  it('Should match wildcard ref between class name and color', () => {
    const fileContent = `
      .bgRed {
        background-color: red;
      }
    `
    const queries = [
      `
        .bg$$_colorRef {
          background-color: $$_colorRef;
        }
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      caseInsensitive: true,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)

    expect(matches[0].aliases.stringAliasesMap['colorRef'].aliasValue).toBe(
      'Red',
    )
  })

  it('Should not match wildcard ref between class name and color for case sensitive search', () => {
    const fileContent = `
      .bgRed {
        background-color: red;
      }
    `
    const queries = [
      `
        .bg$$_colorRef {
          background-color: $$_colorRef;
        }
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      caseInsensitive: false,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(0)
  })
})
