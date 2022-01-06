import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'
import fs from 'fs';


describe('JSX', () => {
  let filesList = [] as string[]
  
  beforeAll(async () => {
     filesList = await getFilesList(path.resolve(__dirname, '__fixtures__'))
  })
  
  const tempFilePath = path.join(__dirname, `${Date.now()}.temp`)
  const mockedFilesList = [tempFilePath]
  beforeAll(() => {
    fs.writeFileSync(tempFilePath, `
      <Flex >
    
          <Button
        >
            Download
          </Button>

      </Flex>
    `)
  })

  afterAll(() => {
    fs.unlinkSync(tempFilePath)
  })

  it('Should find all self-closing JSX', () => {
    const query = `<$ />`
    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })
    expect(results.length).toBe(148)
  })

  it('Should find JSX by tag name and prop', () => {
    const query = `
      <Drawer.Section title="Preferences">
      </Drawer.Section>
    `
    const results = search({
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

    expect(compareCode(results[0].code, resultCode)).toBeTruthy()
  })

  it('Should find JSX by prop name', () => {
    const query = `<$ value={$$} />`
    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })
    expect(results.length).toBe(41)
  })

  it('Should find JSX by text content', () => {
    const query = `<Text>RTL</Text>`
    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })
    expect(results.length).toBe(1)
  })

  it('Should find JSX by text content with wildcard case insensitive', () => {
    const query = `<Text>r$L</Text>`
    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
      caseInsensitive: true
    })
    expect(results.length).toBe(1)
  })

  it('Should find JSX by text content case insensitive', () => {
    const query = `<Text>rtl</Text>`
    const results = search({
      mode: 'include',
      filePaths: filesList,
      caseInsensitive: true,
      queryCodes: [query],
    })
    expect(results.length).toBe(1)
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
    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: [query],
    })

    expect(compareCode(results[0].code, query)).toBeTruthy()
  })

  it('Should find components using useTheme() hook', () => {

    const usageQuery = `
      const $$ = useTheme();
    `

    const importQuery = `
      import {
        useTheme,
      } from 'react-native-paper';
    `

    const resultsUsage = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [usageQuery],
    })

    const resultsImport = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [importQuery],
    })
    expect(resultsImport.length).not.toBe(0)

    expect(resultsImport.length).toBe(resultsUsage.length)
  })

  it('Should find all usages of component passed as a prop', () => {
    const query1 = `
      <$$
        $={() => (
          <IconButton />
        )}
      />
    `

    const query2 = `
      <$$
        $={IconButton}
      />
    `
    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query1, query2],
    })

    expect(results.length).toBe(2)
  })

  it('Should find all anonymous functions passed as a prop', () => {
    const queries = [
      `
      <$$
        $={() => $$}
      />
    `,
      `
      <$$
        $={() => $$}
      >
      </$$>
    `
    ]

    const results = search({
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

    expect(results.length).toBe(190)
    expect(compareCode(results[0].code, firstResultCode)).toBeTruthy()
  })

  it('Should find all anonymous functions passed as event listener handler', () => {
    const queries = [
      `
      <$$
        on$={() => $$}
      />
    `,
      `
      <$$
        on$={() => $$}
      >
      </$$>
    `
    ]

    const results = search({
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

    expect(results.length).toBe(164)
    expect(compareCode(results[0].code, firstResultCode)).toBeTruthy()
  })

  it('Should find all Elements pretending to be a wrapper', () => {
    const queries = [
      `
      <$Wrapper/>
    `,
      `
      <$Wrapper>
      </$Wrapper>
    `
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(34)
  })

  it('Should find all title prop values which are strings', () => {
    const queries = [
      `
      <$$ title="$" />
    `,
      `
      <$$ title="$">
      </$$>
    `,
      `
      <$$ title={"$"} />
    `,
      `
      <$$ title={"$"}>
      </$$>
    `
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(78)
  })

  it('Should ignore all empty JSXText in search', () => {
    const queries = [
      `
        <$>
          $
        </$>;
    `]

    const results = search({
      mode: 'include',
      filePaths: mockedFilesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
    expect(compareCode(results[0].code,
      ` <Button>
          Download
        </Button>
      `
    )).toBeTruthy()
  })


})