import { patternToRegex } from "/utils";

describe('Utils', () => {
  describe('should transform strings to regexes', () => {
    it('should match JSX event listeners props ', () => {
      const pattern = 'on$'
      const regex = patternToRegex(pattern)

      expect(regex.test('onClick')).toBeTruthy()
      expect(regex.test('onHover')).toBeTruthy()
    })

    it('should match any string', () => {
      const pattern = '$'
      const regex = patternToRegex(pattern)

      expect(regex.test('react-native-image')).toBeTruthy()
      expect(regex.test('Some sentence with words')).toBeTruthy()
    })

    it('should not match some strings with non-optional wildcard', () => {
      const pattern = 'react-native-$$'
      const regex = patternToRegex(pattern)

      expect(regex.test('react-native-')).toBeFalsy()
      expect(regex.test('react-native')).toBeFalsy()
      expect(regex.test('preact-native')).toBeFalsy()
    })

    it('should not match some strings with optional wildcard', () => {
      const pattern = 'react-native-$'
      const regex = patternToRegex(pattern)

      expect(regex.test('react-native-')).toBeTruthy()
      expect(regex.test('react-native')).toBeFalsy()
      expect(regex.test('preact-native')).toBeFalsy()
    })

    it('should match multiple wildcards in pattern', () => {
      const pattern = '../$$/$/file'
      const regex = patternToRegex(pattern)

      expect(regex.test('../dir/somedir/file')).toBeTruthy()
      expect(regex.test('../dir//file')).toBeTruthy()
      expect(regex.test('..//file')).toBeFalsy()
      expect(regex.test('preact-native')).toBeFalsy()
    })

    it('should match wildcard on pattern start', () => {
      const pattern = '$/file'
      const regex = patternToRegex(pattern)

      expect(regex.test('../dir/somedir/file')).toBeTruthy()
      expect(regex.test('..///file')).toBeTruthy()
      expect(regex.test('react-native/file')).toBeTruthy()
      expect(regex.test('react-native/files')).toBeFalsy()
      expect(regex.test('/files')).toBeFalsy()
    })

    it('should match space by wildcard', () => {
      const pattern = 'some$string'
      const regex = patternToRegex(pattern)

      expect(regex.test('some string')).toBeTruthy()
    })

    it('should throw due to invalid string wildcard', () => {
      const pattern = 'asd$$$asd$$as$'
      expect(() => patternToRegex(pattern)).toThrow()
    })

    it('should match case insensitive string wildcard', () => {
      const pattern = 'some$file'
      const regex = patternToRegex(pattern, true)

      expect(regex.test('Some filE')).toBeTruthy()
    })
  })
})