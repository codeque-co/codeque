import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'

const filesList = getFilesList(path.resolve(__dirname, '__fixtures__'))

describe('functions', () => {
  it('should match inline types in function params', () => {
    const queries = [`
      const $ = ({
        $,
      }: {
        $: () => $$;
      }) => $$
      `,
      `
        const $ = ({
          $,
        }: {
          $: () => $$;
        }) => {}
      `,
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(4)
  })

  it('should match exact function with body', () => {
    const queries = [`
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

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(1)
    expect(compareCode(results[0].code, queries[0])).toBeTruthy()
  })

  it('should match function with body statements in order with exact statements', () => {
    const queries = [`
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

    const results = search({
      mode: 'include-with-order',
      filePaths: filesList,
      queries,
    })
    expect(results.length).toBe(1)
  })

  it('should match function with body statements in order but without all statements', () => {
    const queries = [`
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

    const results = search({
      mode: 'include-with-order',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(1)
  })

  it('should not match function with body statements in different order', () => {
    const queries = [`
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

    const results = search({
      mode: 'include-with-order',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(0)
  })

  it('should not match function with body statements in different order without all statements', () => {
    const queries = [`
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

    const results = search({
      mode: 'include-with-order',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(0)
  })

  it('should match function with body statements in different order', () => {
    const queries = [`
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

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(1)
  })

  it('should match function with body statements in different order without all statements', () => {
    const queries = [`
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

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(1)
  })


})