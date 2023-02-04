import { searchInFileSystem } from '/searchInFs'
import { compareCode } from '../utils'

import path from 'path'
import { getFilesList } from '/getFilesList'
import fs from 'fs'
import { searchInStrings } from '../../src/searchInStrings'

describe('JSX', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: path.resolve(__dirname, '__fixtures__'),
      omitGitIgnore: true,
    })
  })

  const tempFilePath = path.join(
    __dirname,
    '__fixtures__',
    `${Date.now()}.temp`,
  )
  const mockedFilesList = [tempFilePath]

  beforeAll(() => {
    fs.writeFileSync(
      tempFilePath,
      `
      <>
        <Flex >
      
            <Button
          >
              Press to 
              Download
            </Button>

        </Flex>

        <Button>
          Press to
          Download
        </Button>

        <Button>
          Click
          <Icon />
        </Button>
      </>
    `,
    )
  })

  afterAll(() => {
    fs.unlinkSync(tempFilePath)
  })

  it('Should find all self-closing JSX', () => {
    const query = `<$$ />`
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })
    expect(matches.length).toBe(485)
    expect(errors).toHaveLength(0)
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

    expect(compareCode(matches[0].code, resultCode)).toBeTruthy()
    expect(errors).toHaveLength(0)
  })

  it('Should find JSX by prop name', () => {
    const query = `<$$ value={$$$} />`
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })
    expect(matches.length).toBe(41)
    expect(errors).toHaveLength(0)
  })

  it('Should find JSX by text content', () => {
    const query = `<Text>RTL</Text>`
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })
    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('Should find JSX by text content regardless formatting', () => {
    const query = `
      <Button>
        Press to 
        Download
      </Button>
    `
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: mockedFilesList,
      queryCodes: [query],
    })
    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('Should find JSX by text content with wildcard case insensitive', () => {
    const query = `<Text>r$$L</Text>`
    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
      caseInsensitive: true,
    })
    expect(errors.length).toBe(0)
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
    expect(errors.length).toBe(0)
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

    expect(compareCode(matches[0].code, query)).toBeTruthy()
    expect(errors).toHaveLength(0)
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
    expect(resultsImport.length).not.toBe(0)

    expect(resultsImport.length).toBe(resultsUsage.length)
    expect(errorsUsage).toHaveLength(0)
    expect(errorsImport).toHaveLength(0)
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

    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(190)
    expect(compareCode(matches[0].code, firstResultCode)).toBeTruthy()
    expect(errors).toHaveLength(0)
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

    expect(matches.length).toBe(164)
    expect(compareCode(matches[0].code, firstResultCode)).toBeTruthy()
    expect(errors).toHaveLength(0)
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

    expect(matches.length).toBe(34)
    expect(errors).toHaveLength(0)
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

    expect(matches.length).toBe(78)
    expect(errors).toHaveLength(0)
  })

  it('Should ignore all empty JSXText in search', () => {
    const queries = [
      `
        <$$>
          $$
        </$$>;
    `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: mockedFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(3)

    expect(
      compareCode(
        matches[0].code,
        ` <Button>
          Press to 
          Download
        </Button>
      `,
      ),
    ).toBeTruthy()
  })

  it('Should match code with nested JSX when using wildcard on text content', () => {
    const queries = [
      `
        <Button>
          c$$$
        </Button>;
    `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      caseInsensitive: true,
      filePaths: mockedFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)

    expect(
      compareCode(
        matches[0].code,
        ` <Button>
        Click
        <Icon />
      </Button>
      `,
      ),
    ).toBeTruthy()
  })

  describe('Self and not self closing JSX tags in include mode', () => {
    it('Self-closing JSX tag in query should match also not self-closing tags', () => {
      const fileContent = `
      <Comp>asd</Comp>;
      <Comp filed={5}>bbc</Comp>;
      
      <Comp/>;
      <Comp prop="val"/>
    
    `

      const queries = [
        `
      <Comp />
    `,
      ]

      const { matches, errors } = searchInStrings({
        mode: 'include',
        caseInsensitive: true,
        queryCodes: queries,
        files: [
          {
            path: 'mock',
            content: fileContent,
          },
        ],
      })

      expect(matches.length).toBe(4)
      expect(errors.length).toBe(0)
    })

    it('Not self-closing JSX tag in query should match also self-closing tags', () => {
      const fileContent = `
        <Comp>asd</Comp>;
        <Comp filed={5}>bbc</Comp>;
        
        <Comp/>;
        <Comp prop="val"/>
      
      `

      const queries = [
        `
        <Comp></Comp>
      `,
      ]

      const { matches, errors } = searchInStrings({
        mode: 'include',
        caseInsensitive: true,
        queryCodes: queries,
        files: [
          {
            path: 'mock',
            content: fileContent,
          },
        ],
      })

      expect(matches.length).toBe(4)
      expect(errors.length).toBe(0)
    })

    it('Not self-closing JSX tag with children in query should not match self-closing tags', () => {
      const fileContent = `  
      <Comp/>;
      <Comp prop="val"/>
    
    `

      const queries = [
        `
      <Comp>asd</Comp>
    `,
      ]

      const { matches, errors } = searchInStrings({
        mode: 'include',
        caseInsensitive: true,
        queryCodes: queries,
        files: [
          {
            path: 'mock',
            content: fileContent,
          },
        ],
      })

      expect(matches.length).toBe(0)
      expect(errors.length).toBe(0)
    })

    it('Self-closing JSX tag with prop in query should match also not self-closing tag with prop', () => {
      const fileContent = `
      <Comp>asd</Comp>;
      <Comp filed={5}>bbc</Comp>;
      
      <Comp/>;
      <Comp filed={5}/>
    
    `

      const queries = [
        `
      <Comp filed={5} />
    `,
      ]

      const { matches, errors } = searchInStrings({
        mode: 'include',
        caseInsensitive: true,
        queryCodes: queries,
        files: [
          {
            path: 'mock',
            content: fileContent,
          },
        ],
      })

      expect(matches.length).toBe(2)
      expect(errors.length).toBe(0)
    })
  })

  describe('JSXIdentifiers like Identifiers', () => {
    it('Should match JSXIdentifier when looking for Identifier', () => {
      const fileContent = `
        <Comp>asd</Comp>;
      `

      const queries = [
        `
        Comp;
      `,
      ]

      const { matches, errors } = searchInStrings({
        mode: 'include',
        caseInsensitive: true,
        queryCodes: queries,
        files: [
          {
            path: 'mock',
            content: fileContent,
          },
        ],
      })

      expect(matches.length).toBe(2)
      expect(errors.length).toBe(0)
    })

    it('Should match JSXIdentifier when looking for Identifier wildcard', () => {
      const fileContent = `
        <Comp>asd</Comp>;
      `

      const queries = [
        `
          Co$$;
        `,
      ]

      const { matches, errors } = searchInStrings({
        mode: 'include',
        caseInsensitive: true,
        queryCodes: queries,
        files: [
          {
            path: 'mock',
            content: fileContent,
          },
        ],
      })

      expect(matches.length).toBe(2)
      expect(errors.length).toBe(0)
    })
  })

  it('Should not match too much values using wildcards in JSXText', () => {
    const fileContent = `
      <title>Edit Client - Dweet</title>
    `

    const queries = [
      `
        <title>$$| Dweet |$$</title>;
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      caseInsensitive: true,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(matches.length).toBe(0)
    expect(errors.length).toBe(0)
  })
})
