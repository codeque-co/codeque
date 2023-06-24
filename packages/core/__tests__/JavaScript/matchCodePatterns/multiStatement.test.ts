import { compareCode } from '../../utils'

import searchInStrings from '../../../src/searchInStrings'

describe('multi statements', () => {
  it('should find proper position in file if one of the multiline query statements is matched more than once in file node', () => {
    const fileContent = `
        const result =  db.model.findUnique();

        if (!result) {
          throw new Error();
        }

        const results =  db.model2.find();
    `

    const queries = [
      ` 
        const $$ =  db.$$.$$();

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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)

    const expectedMatch = `
      const result = db.model.findUnique();

      if (!result) {
        throw new Error();
      }
    `
    expect(compareCode(matches[0].code, expectedMatch)).toBe(true)
  })

  it('should find proper position in file for several exact same statements in query and file', () => {
    const fileContent = `
        export * from 'fileA'
        export * from 'fileB'
        export * from 'fileC'
        export * from 'fileD'

    `

    const queries = [
      ` 
        export * from '$$'
        export * from '$$'
        export * from '$$'
      `,
    ]

    const files = [
      {
        content: fileContent,
        path: 'test-path',
      },
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)

    const expectedMatch1 = `
    export * from 'fileA'
    export * from 'fileB'
    export * from 'fileC'
    `

    expect(compareCode(matches[0].code, expectedMatch1)).toBe(true)
  })
})

describe('multi statements 2', () => {
  const fileContent = `
    () => {
      toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
    }
  `

  it('should match three expressions without block wrapper in function body', () => {
    const queries = [
      `
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
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

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [{ content: fileContent, path: '' }],
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

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
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

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  const fileContent2 = `
    import * as React from 'react'
    import { Appbar } from 'react-native-paper'
    import { createStackNavigator } from '@react-navigation/stack'
    import ExampleList, { examples } from './ExampleList'
    const Stack = createStackNavigator()

    export default function Root() {
      return (
        <Stack.Navigator/>
      )
    }
  `

  it('should match two expressions in program body and include middle line in result', () => {
    const queries = [
      ` 
        import { createStackNavigator } from '@react-navigation/stack';
        const Stack = createStackNavigator();
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent2, path: '' }],
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

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent2, path: '' }],
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

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
      files: [{ content: fileContent2, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(0)
  })
})
