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
      queries,
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
      queries,
    })

    expect(results.length).toBe(1)
  })

  it('should match nested ternary operator', () => {
    const queries = [`
      $$ ? $$ : $$ ? $$ : $$
    `]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queries,
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
      queries,
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
      queries: [query],
    })

    expect(results.length).toBe(3)
    expect(results[2].code).toBe("console.log('Pressed')")
  })

})