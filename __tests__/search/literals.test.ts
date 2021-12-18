import { search } from '/search'
import path from 'path'
import fs from 'fs'


describe('Types', () => {
  const tempFilePath = path.join(__dirname, `${Date.now()}.temp`)
  const filesList = [tempFilePath]
  beforeAll(() => {
    fs.writeFileSync(tempFilePath, `
      (999);
      "somestring";
      'somestring';

      "'other";
      '\\'other';

      'react-native';

      123 + 321 ;

      [ab, d, 'asd', {}]
    `)
  })

  afterAll(() => {
    fs.unlinkSync(tempFilePath)
  })

  it('should match string regardless used quotes', () => {
    const queries = [`
      ("somestring");
      `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(2)
  })

  it('should match string with optional wildcard', () => {
    const queries = [`
      ("somestring$");
      `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(2)
  })

  it('should match string case insensitive', () => {
    const queries = [`
      ("SOMeString");
      `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
      caseInsensitive: true
    })

    expect(results.length).toBe(2)
  })

  it('should match string with quite inside regardless used quotes', () => {
    const queries1 = [`('\\'other');`]

    const results1 = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries1,
    })

    expect(results1.length).toBe(2)

    const queries2 = [`("'other");`]

    const results2 = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries2,
    })

    expect(results2.length).toBe(2)
  })

  it('should match string using pattern', () => {
    const queries = [`('$other');`]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(2)
  })

  it('should match string using pattern 2', () => {
    const queries = [`('$t$');`]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(5)
  })

  it('should match string with wildcard inside string', () => {
    const queries = [`('react$native');`]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
  })

  it('should match numeric literal', () => {
    const queries = [`(0x0);`]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(3)
  })

  it('should match array literal elements with mixed order', () => {
    const queries = [`[$$, $, a$, 'asd']`]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
  })


})