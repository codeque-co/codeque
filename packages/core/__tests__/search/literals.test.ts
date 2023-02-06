import { searchInFileSystem } from '/searchInFs'
import path from 'path'
import fs from 'fs'
import { searchInStrings } from '../../src/searchInStrings'

describe('Literals', () => {
  const tempFilePath = path.join(
    __dirname,
    '__fixtures__',
    `${Date.now()}.temp`,
  )
  const filesList = [tempFilePath]

  beforeAll(() => {
    fs.writeFileSync(
      tempFilePath,
      `
      (999);
      "somestring";
      'somestring';

      "'other";
      '\\'other';

      'react-native';

      123 + 321 ;

      [ab, d, 'asd', {}]

      ${'`${id}`'}
      ${'`${id}${id2}`'}
      ${'`val ${id} text ${id2}`'}
    `,
    )
  })

  afterAll(() => {
    fs.unlinkSync(tempFilePath)
  })

  it('should match string regardless used quotes', () => {
    const queries = [
      `
      ("somestring");
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match string with optional wildcard', () => {
    const queries = [
      `
      ("somestring$$");
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match string case insensitive', () => {
    const queries = [
      `
      ("SOMeString");
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
      caseInsensitive: true,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match string with quite inside regardless used quotes', () => {
    const queries1 = [`('\\'other');`]

    const { matches: results1, errors: errors1 } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries1,
    })

    expect(errors1).toHaveLength(0)
    expect(results1.length).toBe(2)

    const queries2 = [`("'other");`]

    const { matches: results2, errors: errors2 } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries2,
    })

    expect(errors2).toHaveLength(0)
    expect(results2.length).toBe(2)
  })

  it('should match string using pattern', () => {
    const queries = [`('$$other');`]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match string using pattern 2', () => {
    const queries = [`('$$t$$');`]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(5)
  })

  it('should match string with wildcard inside string', () => {
    const queries = [`('react$$native');`]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match numeric literal', () => {
    const queries = [`(0x0);`]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(3)
  })

  it('should match array literal elements with mixed order', () => {
    const queries = [`[$$$, $$, a$$, 'asd']`]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match template literals with empty quasis', () => {
    const queries = ['`${id}`']

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should not match template literals with empty quasis using required string wildcard', () => {
    const queries = ['`$$$${id}`']

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(0)
  })

  it('should match template literals with quasis', () => {
    const queries = ['`val ${id} text ${id2}`']

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match template literals with quasis with wildcard', () => {
    const queries = ['`val ${id} $$ ${id2}`']

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match template literals with quasis with wildcard in id', () => {
    const queries = ['`val ${$$} text ${$$}`']

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match multiple template literals with include mode', () => {
    const queries = ['`{$$}`']

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(0)
  })

  it('should match different parts of template literals with include mode', () => {
    const fileContent = '`pre${c}pre${fn()}post`'

    // Cannot execute in one query because longest match shadow others
    const queries1 = ['`${fn()}`']
    const queries2 = ['`pre${fn()}`']
    const queries3 = ['`pre${fn()}post`']

    const { matches: matches1, errors: errors1 } = searchInStrings({
      mode: 'include',
      caseInsensitive: true,
      queryCodes: queries1,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors1.length).toBe(0)
    expect(matches1.length).toBe(1)

    const { matches: matches2, errors: errors2 } = searchInStrings({
      mode: 'include',
      caseInsensitive: true,
      queryCodes: queries2,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors2.length).toBe(0)
    expect(matches2.length).toBe(1)

    const { matches: matches3, errors: errors3 } = searchInStrings({
      mode: 'include',
      caseInsensitive: true,
      queryCodes: queries3,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors3.length).toBe(0)
    expect(matches3.length).toBe(1)
  })

  it('should match multiline template literals with include mode', () => {
    const fileContent = `
      \`pre\${id}
      
      post
      \``

    const queries = ['`pre${id}post`']

    const { matches: matches, errors: errors } = searchInStrings({
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

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })
})
