import { compareCode } from '../../utils'

import { searchInStrings } from '../../../src/searchInStrings'

describe('blocks', () => {
  it('should match exact whole block', () => {
    const fileContent = `
      const fn = () => {
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      }
    `

    const queries = [
      `
      () => {
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      }
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)

    expect(compareCode(matches[0].code, queries[0])).toBeTruthy()
  })

  it('should match block using query without all statements and different order', () => {
    const fileContent = `
      const fn = () => {
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      }
    `

    const queries = [
      `
      () => {
        Updates.reloadAsync();
        toggleRTL();
      }
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should match block using query without all statements, but with order', () => {
    const fileContent = `
      const fn = () => {
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      }
    `

    const queries = [
      `
      () => {
        toggleRTL();
        Updates.reloadAsync();
      }
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should match contents inside catch block', () => {
    const fileContent = `
        try {
          someFn()
        }
        catch (e) {
          const a = 'b'
          const b = 'a'
          throw Error('some')
        }

        function some() {
          throw Error('some')

          const a = 'b'
        }
      `

    const queries = [
      `
      {
        const a = 'b'
        throw Error('some')
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
    expect(matches.length).toBe(2)
  })

  it('should match arrow function block using tree wildcard', () => {
    const fileContent = `
      const a = () => {
        console.log()
      }
      `

    const queries = [
      `
      () => $$$
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
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
  })

  it('should match whole program using block wildcard', () => {
    const fileContent = `
      import a from 'b'
      import c from 'd'

      module.exports = {
        fn: () => a + b
      }
    `

    const queries = [
      `
      {}
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
    expect(compareCode(matches[0].code, fileContent)).toBe(true)
  })
})
