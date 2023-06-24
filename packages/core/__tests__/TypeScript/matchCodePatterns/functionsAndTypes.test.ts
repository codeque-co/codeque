import { searchInStrings } from '../../../src/searchInStrings'
import { compareCode } from '../../utils'

describe('functions', () => {
  const fileContent = `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
        setExtended(currentScrollPosition <= 0);
      };
    `

  it('should match exact function with body', () => {
    const queries = [
      `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
        setExtended(currentScrollPosition <= 0);
      };
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)

    expect(compareCode(matches[0].code, queries[0])).toBeTruthy()
  })

  it('should match function with body statements in order with exact statements', () => {
    const queries = [
      `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
        setExtended(currentScrollPosition <= 0);

      };
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should match function with body statements in order but without all statements', () => {
    const queries = [
      `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
      };
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should not match function with body statements in different order', () => {
    const queries = [
      `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
        setExtended(currentScrollPosition <= 0);

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
      };
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(0)
  })

  it('should not match function with body statements in different order without all statements', () => {
    const queries = [
      `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }

        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
      };
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(0)
  })

  it('should match function with body statements in different order', () => {
    const queries = [
      `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
        setExtended(currentScrollPosition <= 0);

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
      };
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

  it('should match function with body statements in different order without all statements', () => {
    const queries = [
      `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }

        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
      };
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

  it('should match inline types in function params', () => {
    const fileContent = `
      const onScroll = ({
        onClick
      }: { onClick : () => string }) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
        setExtended(currentScrollPosition <= 0);
      };
    `
    const queries = [
      `
        const $$ = ({
          $$,
        }: {
          $$: () => $$$;
        }) => {}
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
