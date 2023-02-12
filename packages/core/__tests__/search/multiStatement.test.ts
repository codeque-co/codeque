import { searchInFileSystem } from '/searchInFs'
import { compareCode } from '../utils'

import path from 'path'
import { getFilesList } from '/getFilesList'
import searchInStrings from '/searchInStrings'

describe('multi statements', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: path.resolve(__dirname, '__fixtures__'),
      omitGitIgnore: true,
    })
  })

  it('should match three expressions without block wrapper in function body', () => {
    const queries = [
      `
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match three expressions without block wrapper in function body with exact mode', () => {
    const queries = [
      `
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match three expressions without block wrapper in function body with different order', () => {
    const queries = [
      `
        Updates.reloadAsync();
        I18nManager.forceRTL(!isRTL);
        toggleRTL();
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match three expressions with block wrapper in function body', () => {
    const queries = [
      `
      {
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      }
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match two expressions in program body and include middle line in result', () => {
    const queries = [
      ` 
        import { createStackNavigator } from '@react-navigation/stack';
        const Stack = createStackNavigator();
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)

    expect(matches[0].code.split('\n').filter(Boolean)).toHaveLength(3)
  })

  it('should match three expressions in program body and only include them in result (without whole block)', () => {
    const queries = [
      ` 
      import { createStackNavigator } from '@react-navigation/stack'
      import ExampleList, { examples } from './ExampleList'
      const Stack = createStackNavigator()
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)

    expect(compareCode(matches[0].code, queries[0])).toBeTruthy()
  })

  it('should not match two expressions in program body if order does not match', () => {
    const queries = [
      ` 
        const Stack = createStackNavigator();
        import { createStackNavigator } from '@react-navigation/stack';
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include-with-order',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(0)
  })

  it('should find proper position in file if one of the multiline query statements is matched more than once in file node', () => {
    const fileContent = `
        const result = await db.model.findUnique();

        if (!result) {
          throw new Error();
        }

        const results = await db.model2.find();
    `

    const queries = [
      ` 
        const $$ = await db.$$.$$();

        if (!$$) {
          throw new Error();
        }
      `,
    ]

    const files = [
      {
        content: fileContent,
        path: 'test-path',
      },
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
      files,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)

    const expectedMatch = `
      const result = await db.model.findUnique();

      if (!result) {
        throw new Error();
      }
    `
    expect(compareCode(matches[0].code, expectedMatch)).toBe(true)
  })
})
