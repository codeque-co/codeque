import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'
import fs from 'fs';
const filesList = getFilesList(path.resolve(__dirname, '__fixtures__'))

describe('Types', () => {

  const tempFilePath = path.join(__dirname, `${Date.now()}.temp`)
  const mockFilesList = [tempFilePath]

  beforeAll(() => {
    fs.writeFileSync(tempFilePath, `
      type ReturnTypeInferer<T> = T extends (a: Record<string, string>) => infer U ? U : never;

    `)
  })

  afterAll(() => {
    fs.unlinkSync(tempFilePath)
  })

  it('should match type that concatenates other type', () => {
    const queries = [`
      type $ = ScrollViewProps & $
      `,
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
  })

  it('should match string enumeration type with exact mode', () => {
    const queries = [`
      type $ = "$" | "$"
      `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
  })

  it('should match string enumeration type with include mode', () => {
    const queries = [`
      type $ = "$" | "$"
      `,
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(3)
  })

  it('should match generic type parametrization', () => {
    const queries = [`
        type $ = {
          $: $<$$>;
        };     
       `,
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(4)
  })

  it('should match indexed object type with wildcard', () => {
    const queries = [`
      type $ = {
        [key: string]: $$;
      };   
       `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(2)
  })

  it('should match some indexed object type with partially wildcard identifier', () => {
    const queries = [`
      type $Visibility = {
        [key: string]: boolean | undefined
      };   
       `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(2)
  })

  it('should match some indexed object type', () => {
    const queries = [`
      type $ = {
        [key: $]: $$
      };   
       `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(2)
  })

  it('should match types union inside indexed object type', () => {
    const queries = [`
      type $ = {
        [key: string]: boolean | $;
      };   
       `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(2)
  })

  it('should some random generic type', () => {
    const queries = [`
      type ReturnTypeInferer<T> = T extends (a: Record<string, string>) => infer U ? U : never; 
       `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
  })

  it.skip('should match wildcard as generic param', () => {
    const queries = [`
      type ReturnTypeInferer<$> = $ extends (a: Record<string, string>) => infer U ? U : never; 
       `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
  })

  it('should match wildcard in conditional type', () => {
    const queries = [`
      type $<T> = T extends $$ ? $$ : $$
       `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
  })
})