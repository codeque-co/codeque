import { searchInFileSystem } from '/searchInFs'
import { compareCode } from '/astUtils'
import path from 'path'
import { getFilesList } from '/getFilesList'

describe('code patterns', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList(path.resolve(__dirname, '__fixtures__'))
  })

  it('Should match function with redundant block statement', () => {
    const queries = [
      `
      const $$ = () => {
        return $$$
      };
      `,
      `const $$ = ($$$) => {
        return $$$
      };
      `
    ]

    const { matches } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    const firstResult = `
      const DrawerContent = () => {
        return <PreferencesContext.Consumer>
            {preferences => <DrawerItems toggleTheme={preferences.toggleTheme} toggleRTL={preferences.toggleRtl} isRTL={preferences.rtl} isDarkTheme={preferences.theme.dark} />}
          </PreferencesContext.Consumer>;
      };
    `

    expect(matches.length).toBe(10)
    expect(compareCode(matches[0].code, firstResult)).toBeTruthy()
  })

  it('should match possible falsy event listeners', () => {
    const queries = [
      `
      <$$
        $$={$$$ && $$$}
      />
    `,
      `
      <$$
        $$={$$$ && $$$}
      >
      </$$>
    `
    ]

    const { matches } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(1)
  })

  it('should find all empty event listeners', () => {
    const queries = [
      `
      <$$
        on$$={()=>{}}
      />
    `,
      `
      <$$
        on$$={()=>{}}
      >
      </$$>
    `
    ]

    const { matches } = searchInFileSystem({
      mode: 'include', // TODO this should be 'exact', no? - we need $$exact() matcher
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(63)
  })

  it('should find all JSX props which always creates new reference', () => {
    const queries = [
      `
      <$$
        $$={()=>{}}
      />
    `,
      `
      <$$
        $$={()=>{}}
      >
      </$$>
    `,
      `
      <$$
        $$={[]}
      />
    `,
      `
      <$$
        $$={[]}
      >
      </$$>
    `,
      `
      <$$
        $$={{}}
      />
    `,
      `
      <$$
        $$={{}}
      >
      </$$>
    `,
      `
      <$$
        $$={$$$()}
      />
    `,
      `
      <$$
        $$={$$$()}
      >
      </$$>
    `
    ]

    const { matches } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(132)
  })

  it('should match nested ternary operator', () => {
    const queries = [
      `
      $$$ ? $$$ : $$$ ? $$$ : $$$
    `
    ]

    const { matches } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })
    expect(matches.length).toBe(1)
  })

  it('should match cast to any', () => {
    const queries = [
      `
      ($$$ as any)
    `
    ]

    const { matches } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(2)
  })

  it('should find all console logs', () => {
    const query = `
      console.log()
    `
    const { matches } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query]
    })

    expect(matches.length).toBe(3)
    expect(matches[2].code).toBe("console.log('Pressed')")
  })

  it('Should find all requires of jpg assets', () => {
    const queries = [
      `
      require("$$assets$$.jpg")
    `
    ]

    const { matches } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(6)
  })

  it('Should find all string concatenations using + operator', () => {
    const queries = [
      `
      "$$" + "$$"
    `
    ]

    const { matches } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(0)
  })
})
