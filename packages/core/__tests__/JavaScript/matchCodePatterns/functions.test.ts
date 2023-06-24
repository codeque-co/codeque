import { parserType } from '../../utils'
import { searchInStrings } from '../../../src/searchInStrings'

describe('functions', () => {
  it('should match function with 2 arguments', () => {
    const testFileContent = `
    (a,b,c) => {};
    (a,d) => {};
    (a, { b}) => {};
  `

    const mockedFilesList = [
      {
        path: 'mock',
        content: testFileContent,
      },
    ]
    const queries = [
      `
      ($$_ref1, $$_ref2) => {}
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: mockedFilesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('should match function with 2 arguments using double wildcard', () => {
    const testFileContent = `
    (a,b,c) => {};
    (a,d) => {};
    (a, { b}) => {};
  `

    const mockedFilesList = [
      {
        path: 'mock',
        content: testFileContent,
      },
    ]
    const queries = [
      `
      ($$_ref1, $$$_ref2) => {}
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: mockedFilesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(3)
  })

  it('should match function with 3 arguments', () => {
    const testFileContent = `
    (a,b,c) => {};
    (a,d) => {};
    (a, { b}) => {};
  `

    const mockedFilesList = [
      {
        path: 'mock',
        content: testFileContent,
      },
    ]
    const queries = [
      `
      ($$_ref1, $$_ref2, $$_ref3) => {}
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: mockedFilesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  // TODO add support for matching this in babel (works out-of-the-box in EStree parsers)
  if (parserType !== 'babel') {
    it('should match function expression inside object', () => {
      const fileContent = `
      const obj = {
        someFn() {}
      }
    `
      const queries = [
        `
      function() {}
      `,
      ]

      const { matches, errors } = searchInStrings({
        mode: 'include',
        files: [{ content: fileContent, path: 'mockPath' }],
        queryCodes: queries,
      })

      expect(errors).toHaveLength(0)
      expect(matches.length).toBe(1)
    })

    it('should match function expression inside class', () => {
      const fileContent = `
      class Cl {
        someFn() {}
      }
    `
      const queries = [
        `
      function() {}
      `,
      ]

      const { matches, errors } = searchInStrings({
        mode: 'include',
        files: [{ content: fileContent, path: 'mockPath' }],
        queryCodes: queries,
      })

      expect(errors).toHaveLength(0)
      expect(matches.length).toBe(1)
    })
  } else {
    it.todo('should match function expression inside object')
    it.todo('should match function expression inside class')
  }
})
