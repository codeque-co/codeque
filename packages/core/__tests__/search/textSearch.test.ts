import { getFilesList } from '/getFilesList'
import path from 'path'
import { searchInFileSystem } from '/searchInFs'
import dedent from 'dedent'

describe('Text search mode', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: path.resolve(__dirname, '__fixtures__')
    })
  })

  it('should perform basic text search', () => {
    const results = searchInFileSystem({
      queryCodes: [`const $$ = use$$(`],
      filePaths: filesList,
      mode: 'text'
    })

    expect(results.matches.length).toBe(7)
    expect(results.matches[0].code).toBe('const { colors } = useTheme(')
  })

  it('Should match code with optional single line wildcard which exist', () => {
    const { matches } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text $$ label="XD" />
        `
      ],
      filePaths: filesList,
      mode: 'text'
    })

    expect(matches).toHaveLength(1)
  })

  it('Should match code with optional single line wildcard which not exist', () => {
    const { matches } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text style={styles.avatar} label="XD" $$ />
        `
      ],
      filePaths: filesList,
      mode: 'text'
    })

    expect(matches).toHaveLength(2)
  })

  it('Should match code with optional multi line wildcard which exist', () => {
    const { matches } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text
          $$m
          color={Colors.black}
        />
        `
      ],
      filePaths: filesList,
      mode: 'text'
    })

    expect(matches).toHaveLength(2)
  })

  it('Should match code with optional multi line wildcard which not exist', () => {
    const { matches } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Icon
          style={[styles.avatar, { backgroundColor: Colors.yellow500 }]}
          icon="folder" $$m
          color={Colors.black}
        />
        `
      ],
      filePaths: filesList,
      mode: 'text'
    })

    expect(matches).toHaveLength(1)
  })

  it('Should match code with required single line wildcard which exist', () => {
    const { matches } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text $$$ label="XD" />
        `
      ],
      filePaths: filesList,
      mode: 'text'
    })

    expect(matches).toHaveLength(1)
  })

  it('Should not match code with required single line wildcard which not exist', () => {
    const { matches } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Text style={sty$$$les.avatar} label="XD" />
        `
      ],
      filePaths: filesList,
      mode: 'text'
    })

    expect(matches).toHaveLength(0)
  })

  it('Should match code with required multi line wildcard which exist', () => {
    const { matches } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.$$$
          style={[styles.av$$$m
          color={Colors.black}
        />
        `
      ],
      filePaths: filesList,
      mode: 'text'
    })

    expect(matches).toHaveLength(2)
  })

  it('Should not match code with required multi line wildcard which not exist', () => {
    const { matches } = searchInFileSystem({
      queryCodes: [
        dedent`
        <Avatar.Icon
          style={[styles.$$$mavatar, { backgroundColor: Colors.yellow500 }]}
          icon="folder"$$$m
          color={Colors.black}
        />
        `
      ],
      filePaths: filesList,
      mode: 'text'
    })

    expect(matches).toHaveLength(0)
  })

  it('Should match space agnostic code', () => {
    const { matches } = searchInFileSystem({
      queryCodes: [
        dedent`
        <  Avatar.Text


          style={   [styles.   avatar, { 
            backgroundColor: Colors.yellow500 }]}
              label   =   "XD"
          
              color={Colors.black}
        />
        `
      ],
      filePaths: filesList,
      mode: 'text'
    })

    expect(matches).toHaveLength(1)
  })
})
