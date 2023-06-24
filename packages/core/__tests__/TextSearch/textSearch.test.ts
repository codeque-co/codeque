import { getFilesList } from '../../src/getFilesList'
import path from 'path'
import { searchInFileSystem } from '../../src/searchInFs'
import dedent from 'dedent'
import searchInStrings from '../../src/searchInStrings'
import { fixturesPath, fixturesOtherPath } from '../utils'

describe('Text search mode', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: fixturesPath,
      omitGitIgnore: true,
    })
  })

  it('should perform basic text search', () => {
    const results = searchInFileSystem({
      queryCodes: [`const $$ = use$$(`],
      filePaths: filesList,
      mode: 'text',
    })

    expect(results.matches.length).toBe(7)
    expect(results.matches[0].code).toBe('const { colors } = useTheme(')
    expect(results.errors).toHaveLength(0)
  })

  it('Should match code with optional single line wildcard which exist', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text $$ label="XD" />
        `,
      ],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(1)
  })

  it('Should match code with optional single line wildcard which not exist', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text style={styles.avatar} label="XD" $$ />
        `,
      ],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(2)
  })

  it('Should match code with optional multi line wildcard which exist', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text
          $$m
          color={Colors.black}
        />
        `,
      ],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(2)
  })

  it('Should match code with optional multi line wildcard which not exist', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Icon
          style={[styles.avatar, { backgroundColor: Colors.yellow500 }]}
          icon="folder" $$m
          color={Colors.black}
        />
        `,
      ],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(1)
  })

  it('Should match code with required single line wildcard which exist', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text $$$ label="XD" />
        `,
      ],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(1)
  })

  it('Should not match code with required single line wildcard which not exist', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text style={sty$$$les.avatar} label="XD" />
        `,
      ],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(0)
  })

  it('Should match code with required multi line wildcard which exist', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.$$$
          style={[styles.av$$$m
          color={Colors.black}
        />
        `,
      ],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(2)
  })

  it('Should not match code with required multi line wildcard which not exist', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Icon
          style={[styles.$$$mavatar, { backgroundColor: Colors.yellow500 }]}
          icon="folder"$$$m
          color={Colors.black}
        />
        `,
      ],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(0)
  })

  it('Should match space agnostic code', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <  Avatar.Text


          style={   [styles.   avatar, { 
            backgroundColor: Colors.yellow500 }]}
              label   =   "XD"
          
              color={Colors.black}
        />
        `,
      ],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(1)
  })

  it('Should match with wildcard on start of query', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [`$$$m<  Avatar.Text`],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(4)
  })

  it('Should match with wildcard on end of query', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [`<  Avatar.Text$$$m`],
      filePaths: filesList,
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(4)
  })

  const mockJson = dedent`
  {
    "compilerOptions": {
      "strict": false,
      "noEmit": true,
      "allowJs": true,
      "jsx": "react",
      "module": "esnext"
    }
  }
  `

  it('Should match strings with spaces inside', () => {
    const { matches, errors } = searchInStrings({
      queryCodes: [`sx": "re`],
      files: [{ content: mockJson, path: 'mock' }],
      mode: 'text',
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(1)
    expect(matches[0].code).toBe('sx": "re')
  })

  it('Should match query that starts with string', () => {
    const query = `"module": "esnext"`
    const { matches, errors } = searchInStrings({
      queryCodes: [query],
      files: [{ content: mockJson, path: 'mock' }],
      mode: 'text',
    })

    expect(errors).toHaveLength(0)

    const match = matches[0]

    expect(match.code).toBe(query)

    expect(match.loc).toMatchObject({
      start: {
        line: 7,
        column: 4,
      },
      end: {
        line: 7,
        column: 4 + query.length,
      },
    })

    expect(match.extendedCodeFrame.startLine).toBe(6)

    expect(dedent(match.extendedCodeFrame.code)).toBe(
      dedent`
        "jsx": "react",
        "module": "esnext"
      }
      `,
    )
  })

  it('Should compute proper position of match with html like query', () => {
    const { matches, errors } = searchInFileSystem({
      queryCodes: [
        dedent`
        <html><head><meta $$="$$"/>$$$m
        </head>
        `,
      ],
      filePaths: [fixturesOtherPath + '/textSearch.ts'],
      mode: 'text',
      caseInsensitive: true,
    })

    expect(errors).toHaveLength(0)
    expect(matches).toHaveLength(2)

    expect(matches[0].loc).toMatchObject({
      start: { line: 44, column: 12 },
      end: { line: 51, column: 21 },
    })

    expect(matches[1].loc).toMatchObject({
      start: { line: 104, column: 12 },
      end: { line: 111, column: 21 },
    })
  })
})
