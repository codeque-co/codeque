import { search } from '/search'
import path from 'path'
import fs from 'fs'

describe('Types', () => {
  const tempFilePath = path.join(__dirname, `${Date.now()}.temp`)
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
    `
    )
  })

  afterAll(() => {
    fs.unlinkSync(tempFilePath)
  })

  it('should match string regardless used quotes', () => {
    const queries = [
      `
      ("somestring");
      `
    ]

    const { matches } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(2)
  })

  it('should match string with optional wildcard', () => {
    const queries = [
      `
      ("somestring$$");
      `
    ]

    const { matches } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(2)
  })

  it('should match string case insensitive', () => {
    const queries = [
      `
      ("SOMeString");
      `
    ]

    const { matches } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
      caseInsensitive: true
    })

    expect(matches.length).toBe(2)
  })

  it('should match string with quite inside regardless used quotes', () => {
    const queries1 = [`('\\'other');`]

    const { matches: results1 } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries1
    })

    expect(results1.length).toBe(2)

    const queries2 = [`("'other");`]

    const { matches: results2 } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries2
    })

    expect(results2.length).toBe(2)
  })

  it('should match string using pattern', () => {
    const queries = [`('$$other');`]

    const { matches } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(2)
  })

  it('should match string using pattern 2', () => {
    const queries = [`('$$t$$');`]

    const { matches } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(5)
  })

  it('should match string with wildcard inside string', () => {
    const queries = [`('react$$native');`]

    const { matches } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(1)
  })

  it('should match numeric literal', () => {
    const queries = [`(0x0);`]

    const { matches } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(3)
  })

  it('should match array literal elements with mixed order', () => {
    const queries = [`[$$$, $$, a$$, 'asd']`]

    const { matches } = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(1)
  })

  it('should match template literals with empty quasis', () => {
    const queries = ['`${id}`']

    const { matches } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(1)
  })

  it('should not match template literals with empty quasis using required string wildcard', () => {
    const queries = ['`$$$${id}`']

    const { matches } = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(0)
  })

  it('should match template literals with quasis', () => {
    const queries = ['`val ${id} text ${id2}`']

    const { matches } = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(1)
  })

  it('should match template literals with quasis with wildcard', () => {
    const queries = ['`val ${id} $$ ${id2}`']

    const { matches } = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(1)
  })

  it('should match template literals with quasis with wildcard in id', () => {
    const queries = ['`val ${$$} text ${$$}`']

    const { matches } = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(1)
  })

  it('should match multiple template literals with include mode', () => {
    const queries = ['`{$$}`']

    const { matches } = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(0)
  })
})
