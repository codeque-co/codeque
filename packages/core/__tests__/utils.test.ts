import { getExtendedCodeFrame, regExpTest } from '/utils'
import dedent from 'dedent'
import { createWildcardUtils } from '/wildcardUtilsFactory'

describe('Utils', () => {
  const identifierTypes: string[] = [] // not needed for this test
  const numericWildcard = '0x0'
  const wildcardChar = '$'
  const wildcardUtils = createWildcardUtils(
    identifierTypes,
    numericWildcard,
    wildcardChar,
  )

  describe('should transform strings to regexes', () => {
    it('should match JSX event listeners props ', () => {
      const pattern = 'on$$'
      const regex = wildcardUtils.patternToRegExp(pattern, false)
      regExpTest
      expect(regExpTest(regex, 'onClick')).toBeTruthy()
      expect(regExpTest(regex, 'onHover')).toBeTruthy()
    })

    it('should match any string', () => {
      const pattern = '$$'
      const regex = wildcardUtils.patternToRegExp(pattern, false)

      expect(regExpTest(regex, 'react-native-image')).toBeTruthy()
      expect(regExpTest(regex, 'Some sentence with words')).toBeTruthy()
    })

    it('should not match some strings with non-optional wildcard', () => {
      const pattern = 'react-native-$$$'
      const regex = wildcardUtils.patternToRegExp(pattern, false)

      expect(regExpTest(regex, 'react-native-')).toBeFalsy()
      expect(regExpTest(regex, 'react-native')).toBeFalsy()
      expect(regExpTest(regex, 'preact-native')).toBeFalsy()
    })

    it('should not match some strings with optional wildcard', () => {
      const pattern = 'react-native-$$'
      const regex = wildcardUtils.patternToRegExp(pattern, false)

      expect(regExpTest(regex, 'react-native-')).toBeTruthy()
      expect(regExpTest(regex, 'react-native')).toBeFalsy()
      expect(regExpTest(regex, 'preact-native')).toBeFalsy()
    })

    it('should match multiple wildcards in pattern', () => {
      const pattern = '../$$$/$$/file'
      const regex = wildcardUtils.patternToRegExp(pattern, false)

      expect(regExpTest(regex, '../dir/somedir/file')).toBeTruthy()
      expect(regExpTest(regex, '../dir\\somedir/file')).toBeFalsy()
      expect(regExpTest(regex, '../dir//file')).toBeTruthy()
      expect(regExpTest(regex, '..//file')).toBeFalsy()
      expect(regExpTest(regex, 'preact-native')).toBeFalsy()
    })

    it('should not match multiple wildcards in pattern 1', () => {
      const pattern = '$$_$$'
      const regex = wildcardUtils.patternToRegExp(pattern, false)

      expect(regExpTest(regex, 'withoutDash')).toBeFalsy()
    })

    it('should not match multiple wildcards in pattern 2', () => {
      const pattern = '$$|Text|$$'
      const regex = wildcardUtils.patternToRegExp(pattern, false)

      expect(regExpTest(regex, 'withoutDash')).toBeFalsy()
    })

    it('should match wildcard on pattern start', () => {
      const pattern = '$$/file'
      const regex = wildcardUtils.patternToRegExp(pattern, false)

      expect(regExpTest(regex, '../dir/somedir/file')).toBeTruthy()
      expect(regExpTest(regex, '..///file')).toBeTruthy()
      expect(regExpTest(regex, 'react-native/file')).toBeTruthy()
      expect(regExpTest(regex, 'react-native/files')).toBeFalsy()
      expect(regExpTest(regex, '/files')).toBeFalsy()
    })

    it('should match space by wildcard', () => {
      const pattern = 'some$$string'
      const regex = wildcardUtils.patternToRegExp(pattern, false)

      expect(regExpTest(regex, 'some string')).toBeTruthy()
    })

    it('should throw due to invalid string wildcard', () => {
      const pattern = 'asd$$$$asd$$$as$$'

      expect(() => wildcardUtils.patternToRegExp(pattern, false)).toThrow()
    })

    it('should match case insensitive string wildcard', () => {
      const pattern = 'some$$file'
      const regex = wildcardUtils.patternToRegExp(pattern, true)

      expect(regExpTest(regex, 'Some filE')).toBeTruthy()
    })

    it('should get extended code frame for one line match near file start', () => {
      const code = dedent`
        import a from 'b';

        const someVar = () => {
          console.log('string');
          return 234
        }
      `

      const start = code.indexOf('a from')
      const end = start + 6

      const expectedCodeFrame = "import a from 'b';" + '\n'

      expect(getExtendedCodeFrame({ start, end }, code)[0]).toBe(
        expectedCodeFrame,
      )
    })

    it('should get extended code frame for one line match in file center', () => {
      const code = dedent`
        import a from 'b';

        const someVar = () => {
          console.log('string');
          return 234
        }

        const zzz = 'zzz'
      `

      const start = code.indexOf('log(')
      const end = code.indexOf("g')") + 3

      const expectedCodeFrame = dedent`
      const someVar = () => {
        console.log('string');
        return 234
      `

      expect(getExtendedCodeFrame({ start, end }, code)[0]).toBe(
        expectedCodeFrame,
      )
    })

    it('should get extended code frame for one line match near file end', () => {
      const code = dedent`
        import a from 'b';

        const someVar = () => {
          console.log('string');
          return 234
        }

        const zzz = 'zzz'
      `

      const start = code.indexOf('zzz =')
      const end = start + 5

      const expectedCodeFrame = '\n' + "const zzz = 'zzz'"

      expect(getExtendedCodeFrame({ start, end }, code)[0]).toBe(
        expectedCodeFrame,
      )
    })

    it('should get extended code frame for four lines match near file start', () => {
      const code = dedent`
        import a from 'b';

        const someVar = () => {
          console.log('string')
          return 234
        }

        const zzz = 'zzz'
      `

      const start = code.indexOf("a from 'b'")
      const end = code.indexOf("g')") + 3

      const expectedCodeFrame = dedent`
      import a from 'b';

      const someVar = () => {
        console.log('string')
      `

      expect(getExtendedCodeFrame({ start, end }, code)[0]).toBe(
        expectedCodeFrame,
      )
    })

    it('should get extended code frame for four lines match near file end', () => {
      const code = dedent`
        import a from 'b';

        const someVar = () => {
          console.log('string')
          return 234
        }

        const zzz = 'zzz'
      `

      const start = code.indexOf('someVar')
      const end = code.indexOf('zzz =') + 5

      const expectedCodeFrame = dedent`
      const someVar = () => {
        console.log('string')
        return 234
      }

      const zzz = 'zzz'
      `

      expect(getExtendedCodeFrame({ start, end }, code)[0]).toBe(
        expectedCodeFrame,
      )
    })
  })
})
