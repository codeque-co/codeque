import { patternToRegex, getExtendedCodeFrame } from '/utils'
import dedent from 'dedent'

describe('Utils', () => {
  describe('should transform strings to regexes', () => {
    it('should match JSX event listeners props ', () => {
      const pattern = 'on$$'
      const regex = patternToRegex(pattern)

      expect(regex.test('onClick')).toBeTruthy()
      expect(regex.test('onHover')).toBeTruthy()
    })

    it('should match any string', () => {
      const pattern = '$$'
      const regex = patternToRegex(pattern)

      expect(regex.test('react-native-image')).toBeTruthy()
      expect(regex.test('Some sentence with words')).toBeTruthy()
    })

    it('should not match some strings with non-optional wildcard', () => {
      const pattern = 'react-native-$$$'
      const regex = patternToRegex(pattern)

      expect(regex.test('react-native-')).toBeFalsy()
      expect(regex.test('react-native')).toBeFalsy()
      expect(regex.test('preact-native')).toBeFalsy()
    })

    it('should not match some strings with optional wildcard', () => {
      const pattern = 'react-native-$$'
      const regex = patternToRegex(pattern)

      expect(regex.test('react-native-')).toBeTruthy()
      expect(regex.test('react-native')).toBeFalsy()
      expect(regex.test('preact-native')).toBeFalsy()
    })

    it('should match multiple wildcards in pattern', () => {
      const pattern = '../$$$/$$/file'
      const regex = patternToRegex(pattern)

      expect(regex.test('../dir/somedir/file')).toBeTruthy()
      expect(regex.test('../dir//file')).toBeTruthy()
      expect(regex.test('..//file')).toBeFalsy()
      expect(regex.test('preact-native')).toBeFalsy()
    })

    it('should match wildcard on pattern start', () => {
      const pattern = '$$/file'
      const regex = patternToRegex(pattern)

      expect(regex.test('../dir/somedir/file')).toBeTruthy()
      expect(regex.test('..///file')).toBeTruthy()
      expect(regex.test('react-native/file')).toBeTruthy()
      expect(regex.test('react-native/files')).toBeFalsy()
      expect(regex.test('/files')).toBeFalsy()
    })

    it('should match space by wildcard', () => {
      const pattern = 'some$$string'
      const regex = patternToRegex(pattern)

      expect(regex.test('some string')).toBeTruthy()
    })

    it('should throw due to invalid string wildcard', () => {
      const pattern = 'asd$$$$asd$$$as$$'
      expect(() => patternToRegex(pattern)).toThrow()
    })

    it('should match case insensitive string wildcard', () => {
      const pattern = 'some$$file'
      const regex = patternToRegex(pattern, true)

      expect(regex.test('Some filE')).toBeTruthy()
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
