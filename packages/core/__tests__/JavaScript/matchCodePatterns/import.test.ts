import { searchInStrings } from '../../../src/searchInStrings'

describe('Import', () => {
  it('Should find  imports including some keys with persisted order', () => {
    const fileContent = `
        import {
          Button,
          Wrapper,
          IconButton
        } from 'react-native-paper'
    `
    const query = `
      import {
        Button,
        IconButton
      } from 'react-native-paper'
    `
    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should not find any imports including some keys when order changed', () => {
    const fileContent = `
        import {
          Button,
          Wrapper,
          IconButton
        } from 'react-native-paper'
    `

    const query = `
      import {
        IconButton,
        Button,
      } from 'react-native-paper'
    `
    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(0)
  })

  it('Should find different imports of library', () => {
    const fileContent = `
      import rn from 'react-native'
      import * as rn2 from 'react-native'
      import { View } from 'react-native'
      import { View as RNView } from 'react-native'
    `

    const query = `
      import $$$ from 'react-native';
    `
    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(4)
  })

  it('Should find  default imports of a dependency', () => {
    const fileContent = `
      import ScreenWrapper from '../ScreenWrapper';
      import { ScreenWrapper2 }from '../ScreenWrapper';
    `

    const query = `
      import $$ from '../ScreenWrapper';
    `
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find  default imports with case insensitive query', () => {
    const fileContent = `
      import ScreenWrapper from '../ScreenWrapper';  
    `
    const query = `
      import $$screenwrapper from '../screenwrapper';
    `
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      caseInsensitive: true,
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  // TODO fix it, it should not match the second import
  it('Should find  aliased imports of a dependency', () => {
    const fileContent = `
      import { Provider as PaperProvider } from 'react-native-paper';
      import { Provider } from 'react-native-paper';

    `

    const query = `
      import { Provider as $$ } from 'react-native-paper';
    `
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('Should find  imports with both default and named', () => {
    const fileContent = `
      import Default, { Provider as PaperProvider } from 'react-native-paper';
      import { Provider as PaperProvider2 } from 'react-native-paper';
      import Default2 from 'react-native-paper';

    `
    const query = `
      import $$, { $$$ } from '$$'; 
    `
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find  aliased reexports ', () => {
    // TODO: fix - it matches "export {default} from " but it shouldn't
    const fileContent = `
      export { default } from 'lib'
      export { one as another } from 'lib'

    `

    const query = `
      export { $$ as $$$ } from '$$'; 
    `
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })
})
