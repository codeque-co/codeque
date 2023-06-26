import { compareCode } from '../../utils'
import { searchInFileSystem } from '../../../src/searchInFs'

import { fixturesPath } from '../../utils'
import { getFilesList } from '../../../src/getFilesList'

import { searchInStrings } from '../../../src/searchInStrings'

describe('JSX', () => {
  it('Should find JSX by tag name and prop', () => {
    const fileContent = `
      <Drawer.Section title="Preferences">
        <TouchableRipple onPress={toggleTheme}>
          <View style={styles.preference}>
            <Text>Dark Theme</Text>
            <View pointerEvents="none">
              <Switch value={isDarkTheme} />
            </View>
          </View>
        </TouchableRipple>
      </Drawer.Section>
    `
    const query = `
      <Drawer.Section title="Preferences">
      </Drawer.Section>
    `
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find JSX by prop name', () => {
    const fileContent = `
      (
        <div>
          <input value={123} />
          <div value={123} />
        </div>
      )
    `

    const query = `<$$ value={$$$} />`
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('Should find JSX by text content', () => {
    const fileContent = `
      <div>
        <Text>RTL</Text>
        <Text>TTL</Text>
      </div>
    `

    const query = `<Text>RTL</Text>`
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find JSX by text content regardless formatting', () => {
    const fileContent = `
      <div>
        <Text>Some
        
        Text
      </Text>
      </div>
    `

    const query = `<Text> Some Text </Text>`
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find JSX by text content with wildcard case insensitive', () => {
    const fileContent = `
      <div>
        <Text>RTL</Text>
        <Text>RRL</Text>
      </div>
    `

    const query = `<Text>r$$L</Text>`
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
      caseInsensitive: true,
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('Should find JSX by text content case insensitive', () => {
    const fileContent = `
      <div>
        <Text>RTL</Text>
        <Text>RRL</Text>
      </div>
    `
    const query = `<Text>rtl</Text>`
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      caseInsensitive: true,
      queryCodes: [query],
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find exact multiline JSX', () => {
    const fileContent = `
      const node = <div>
        <View style={styles.preference}>
        <Text>Outlined</Text>
        <Switch
          value={isOutlined}
          onValueChange={() =>
            setIsOutlined((prevIsOutlined) => !prevIsOutlined)
          }
        />
      </View>
      </div>
    `
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
    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find usages of component passed as a prop', () => {
    const fileContent = `
      <div>
        <Section
          leftButton={() => (
            <IconButton />
          )}
        />
        <Card
          btn={() => (
            <IconButton />
          )}
        />
      </div>
    `

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
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query1, query2],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('Should find anonymous function passed as a prop', () => {
    const fileContent = `
      <Drawer.Item {...props}  onPress={() => _setDrawerItem(index)} 
      />
    `

    const queries = [
      `
        <$$$
          $$={() => $$$}
        />
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

  it('Should find anonymous functions passed as event listener handler', () => {
    const fileContent = `
      <Drawer.Item {...props}  onPress={() => _setDrawerItem(index)} 
      />
    `
    const queries = [
      `
        <$$$
          on$$={() => $$$}
        />
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

  it('Should find Elements pretending to be a wrapper', () => {
    const fileContent = `
      <div>
        <SectionWrapper />
        <ContentWrapper>
          <div></div>
        </ContentWrapper>
      </div>
    `

    const queries = [
      `
      <$$Wrapper/>
    `,
      `
      <$$Wrapper>
      </$$Wrapper>
    `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('Should find title prop values which are strings', () => {
    const fileContent = `
      <div>
        <Section title="Test" />
        <Section title={"Test"} ></Section>
      </div>
    `

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

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('Should find jsx with title prop using query without title prop', () => {
    const fileContent = `
      <div title="Test">
        asd
      </div>
    `

    const queries = [
      `
      <$$>asd</$$>
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
})
