import { searchInFileSystem } from '../../../src/searchInFs'
import { compareCode, fixturesPath } from '../../utils'

import { getFilesList } from '../../../src/getFilesList'

describe('multi statements', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: fixturesPath,
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

    expect(errors).toHaveLength(0)
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

    expect(errors).toHaveLength(0)
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

    expect(errors).toHaveLength(0)
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

    expect(errors).toHaveLength(0)
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

    expect(errors).toHaveLength(0)
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

    expect(errors).toHaveLength(0)
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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(0)
  })
})
