import { searchInStrings } from '../../../src/searchInStrings'
import { compareCode } from '../../utils'
import { searchInFileSystem } from '../../../src/searchInFs'

describe('Other', () => {
  it('Should properly match identifiers with multiple wildcard sections', () => {
    const fileContent = `
      varOne;
      var_two;
    `

    const queries = [`$$_$$`]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      caseInsensitive: true,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
    expect(Object.keys(matches[0].aliases.identifierAliasesMap)).toHaveLength(0)
  })

  it('Should properly match identifiers with content before and after wildcard', () => {
    const fileContent = `
      preContentPost;
    `

    const queries = [`pre$$Post`]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      caseInsensitive: true,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should match identifier with aliased wildcard', () => {
    const fileContent = `
      const preContent = 5
    `

    const queries = [`pre$$_ref1`]

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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should match identifier with wildcard with ref and content before and after it', () => {
    const fileContent = `
      const preContentPost = 5
    `

    const queries = [
      `
      pre$$_ref1_Post
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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should match try-catch block with statement and re-throw of error', () => {
    const fileContent = `
    try {
      bla.bla.bla
    } catch (error) {
      logger.error(error);
      throw error;
    }
    `

    const queries = [`try {} catch($$) { Logger.error($$); throw $$ }`]

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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should match class with static method', () => {
    const fileContent = `
      class Test {
        method() { return 0 }
        static getInstance(){
          return new Test()
        }
      }
    `

    const queries = [`class $$ {static getInstance(){}}`]

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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should match function with redundant block statement', () => {
    const fileContent = `
      const DrawerContent = () => {
        return <PreferencesContext.Consumer>
            {preferences => <DrawerItems toggleTheme={preferences.toggleTheme} toggleRTL={preferences.toggleRtl} isRTL={preferences.rtl} isDarkTheme={preferences.theme.dark} />}
          </PreferencesContext.Consumer>;
      };

      const add5 = (val) => {
        return val + 5
      }
    `

    const queries = [
      `
      const $$ = () => {
        return $$$
      };
      `,
      `const $$ = ($$$) => {
        return $$$
      };
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)

    expect(
      compareCode(matches[1].code, `const add5 = (val) => { return val + 5 }`),
    ).toBeTruthy()
  })

  it('should match nested ternary operator', () => {
    const fileContent = `
      a ? b : a.b ? c.d : fn()
    `

    const queries = [
      `
      $$$ ? $$$ : $$$ ? $$$ : $$$
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

  it('should find all console logs', () => {
    const fileContent = `
      console.log('test')
      console.log()
      console.error()
    `

    const query = `
      console.log()
    `
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('Should find all requires of jpg assets', () => {
    const fileContent = `
      const asset = require('public/assets/image.jpg');
      const asset2 = require('image.jpg');

    `

    const queries = [
      `
      require("$$assets$$.jpg")
    `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should find all string concatenations using + operator', () => {
    const fileContent = `
      () => {return "asd" + "ASD"}
    `

    const queries = [
      `
      "$$" + "$$"
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

  it('should not include the same result twice 2', () => {
    const fileContent = `
      fn(() => {
        return 5
      })
    `

    const queries = [
      `
      $$(() => {})
    `,
      `
      $$(() => $$$)
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
