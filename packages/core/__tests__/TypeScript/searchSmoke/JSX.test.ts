import { compareCode } from '../../utils'
import { searchInFileSystem } from '../../../src/searchInFs'

import { fixturesPath } from '../../utils'
import { getFilesList } from '../../../src/getFilesList'

describe('JSX', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: fixturesPath,
      omitGitIgnore: true,
    })
  })

  it('Should find all self-closing JSX', () => {
    const query = `<$$ />`
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(485)
  })

  it('Should find JSX by tag name and prop', () => {
    const query = `
      <Drawer.Section title="Preferences">
      </Drawer.Section>
    `
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })

    const resultCode = `
      <Drawer.Section title="Preferences">
        <TouchableRipple onPress={toggleTheme}>
          <View style={styles.preference}>
            <Text>Dark Theme</Text>
            <View pointerEvents="none">
              <Switch value={isDarkTheme} />
            </View>
          </View>
        </TouchableRipple>
        <TouchableRipple onPress={_handleToggleRTL}>
          <View style={styles.preference}>
            <Text>RTL</Text>
            <View pointerEvents="none">
              <Switch value={isRTL} />
            </View>
          </View>
        </TouchableRipple>
      </Drawer.Section>
    `

    expect(errors).toHaveLength(0)
    expect(compareCode(matches[0].code, resultCode)).toBeTruthy()
  })

  it('Should find JSX by prop name', () => {
    const query = `<$$ value={$$$} />`
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(41)
  })

  it('Should find JSX by text content', () => {
    const query = `<Text>RTL</Text>`
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find JSX by text content with wildcard case insensitive', () => {
    const query = `<Text>r$$L</Text>`
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
      caseInsensitive: true,
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find JSX by text content case insensitive', () => {
    const query = `<Text>rtl</Text>`
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      caseInsensitive: true,
      queryCodes: [query],
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find exact multiline JSX', () => {
    const query = `
      <View style={styles.preference}>
        <Text>Outlined</Text>
        <Switch
          value={isOutlined}
          onValueChange={() =>
            setIsOutlined((prevIsOutlined) => !prevIsOutlined)
          }
        />
      </View>
    `
    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(compareCode(matches[0].code, query)).toBeTruthy()
  })

  it('Should find components using useTheme() hook', () => {
    const usageQuery = `
      const $$$ = useTheme();
    `

    const importQuery = `
      import {
        useTheme,
      } from 'react-native-paper';
    `

    const { matches: resultsUsage, errors: errorsUsage } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [usageQuery],
    })

    const { matches: resultsImport, errors: errorsImport } = searchInFileSystem(
      {
        mode: 'include',
        filePaths: filesList,
        queryCodes: [importQuery],
      },
    )
    expect(errorsUsage).toHaveLength(0)
    expect(errorsImport).toHaveLength(0)

    expect(resultsImport.length).not.toBe(0)
    expect(resultsImport.length).toBe(resultsUsage.length)
  })

  it('Should find all usages of component passed as a prop', () => {
    const query1 = `
      <$$$
        $$={() => (
          <IconButton />
        )}
      />
    `

    const query2 = `
      <$$$
        $$={IconButton}
      />
    `
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query1, query2],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('Should find all anonymous functions passed as a prop', () => {
    const queries = [
      `
        <$$$
          $$={() => $$$}
        />
      `,
      `
        <$$$
          $$={() => $$$}
        >
        </$$$>
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    const firstResultCode = `
      <Drawer.Item {...props} key={props.key} theme={props.key === 3 ? {
        colors: {
          primary: Colors.tealA200
        }
      } : undefined} active={drawerItemIndex === index} onPress={() => _setDrawerItem(index)} 
      />
    `

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(190)
    expect(compareCode(matches[0].code, firstResultCode)).toBeTruthy()
  })

  it('Should find all anonymous functions passed as event listener handler', () => {
    const queries = [
      `
      <$$$
        on$$={() => $$$}
      />
    `,
      `
      <$$$
        on$$={() => $$$}
      >
      </$$$>
    `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    const firstResultCode = `
      <Drawer.Item {...props} key={props.key} theme={props.key === 3 ? {
        colors: {
          primary: Colors.tealA200
        }
      } : undefined} active={drawerItemIndex === index} onPress={() => _setDrawerItem(index)} 
      />
    `

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(164)
    expect(compareCode(matches[0].code, firstResultCode)).toBeTruthy()
  })

  it('Should find all Elements pretending to be a wrapper', () => {
    const queries = [
      `
      <$$Wrapper/>
    `,
      `
      <$$Wrapper>
      </$$Wrapper>
    `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(34)
  })

  it('Should find all title prop values which are strings', () => {
    const queries = [
      `
      <$$$ title="$$" />
    `,
      `
      <$$$ title="$$">
      </$$$>
    `,
      `
      <$$$ title={"$$"} />
    `,
      `
      <$$$ title={"$$"}>
      </$$$>
    `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(78)
  })
})
