import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'

const filesList = getFilesList(path.resolve(__dirname, '__fixtures__'))

describe('code patterns', () => {
  it('Should match function with redundant block statement', () => {
    const queries = [`
      const $ = () => {
        return $$
      };
      `,
      `const $ = ($$) => {
        return $$
      };
      `,
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })


    const firstResult = `
      const DrawerContent = () => {
        return <PreferencesContext.Consumer>
            {preferences => <DrawerItems toggleTheme={preferences.toggleTheme} toggleRTL={preferences.toggleRtl} isRTL={preferences.rtl} isDarkTheme={preferences.theme.dark} />}
          </PreferencesContext.Consumer>;
      };
    `

    expect(results.length).toBe(10)
    expect(compareCode(results[0].code, firstResult)).toBeTruthy()
  })

  it('should match possible falsy event listeners', () => {
    const queries = [`
      <$
        $={$$ && $$}
      />
    `,
      `
      <$
        $={$$ && $$}
      >
      </$>
    `]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
  })

  it('should find all empty event listeners', () => {
    const queries = [`
      <$
        on$={()=>{}}
      />
    `,
      `
      <$
        on$={()=>{}}
      >
      </$>
    `]

    const results = search({
      mode: 'include', // TODO this should be 'exact', no?
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(19)
  })

  it('should find all JSX props which always creates new reference', () => {
    const queries = [
      `
      <$
        $={()=>{}}
      />
    `,
      `
      <$
        $={()=>{}}
      >
      </$>
    `,
      `
      <$
        $={[]}
      />
    `,
      `
      <$
        $={[]}
      >
      </$>
    `,
      `
      <$
        $={{}}
      />
    `,
      `
      <$
        $={{}}
      >
      </$>
    `,
      `
      <$
        $={$$()}
      />
    `,
      `
      <$
        $={$$()}
      >
      </$>
    `
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(74)
  })

  it('should match nested ternary operator', () => {
    const queries = [`
      $$ ? $$ : $$ ? $$ : $$
    `]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })
    expect(results.length).toBe(1)
  })

  it('should match cast to any', () => {
    const queries = [`
      ($$ as any)
    `]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(2)
  })

  it('should find all console logs', () => {
    const query = `
      console.log()
    `
    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: [query],
    })

    expect(results.length).toBe(3)
    expect(results[2].code).toBe("console.log('Pressed')")
  })

  it('Should find all requires of jpg assets', () => {
    const queries = [
      `
      require("$assets$.jpg")
    `
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(6)
  })

  it('Should find all string concatenations using + operator', () => {
    const queries = [
      `
      "$" + "$"
    `
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(results.length).toBe(0)
  })

})