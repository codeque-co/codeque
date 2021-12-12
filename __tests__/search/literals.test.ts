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

      123 + 321 ;
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
      queries,
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
      queries,
    })

    expect(results.length).toBe(2)
  })

  it('should match string with quite inside regardless used quotes', () => {
    const queries1 = [`('\\'other');`]

    const results1 = search({
      mode: 'exact',
      filePaths: filesList,
      queries: queries1,
    })

    expect(results1.length).toBe(2)

    const queries2 = [`("'other");`]

    const results2 = search({
      mode: 'exact',
      filePaths: filesList,
      queries: queries2,
    })

    expect(results2.length).toBe(2)
  })

  it('should match string using pattern', () => {
    const queries = [`('$other');`]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queries: queries,
    })

    expect(results.length).toBe(2)
  })

  it('should match string using pattern 2', () => {
    const queries = [`('$t$');`]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queries: queries,
    })

    expect(results.length).toBe(4)
  })

  it('should match numeric literal', () => {
    const queries = [`(0x0);`]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queries: queries,
    })

    expect(results.length).toBe(3)
  })


})