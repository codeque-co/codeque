import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'
import fs from'fs'
const filesList = getFilesList(path.resolve(__dirname, '__fixtures__'))

describe('functions', () => {
  const tempFilePath = path.join(__dirname, `${Date.now()}.temp`)
  const mockedFilesList = [tempFilePath]
  beforeAll(() => {
    fs.writeFileSync(tempFilePath, `
      (a,b,c) => {};
      (a,d) => {};
      (a, { b}) => {};

    `)
  })

  afterAll(() => {
    fs.unlinkSync(tempFilePath)
  })

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
      queryCodes: queries,
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
      queryCodes: queries,
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
      queryCodes: queries,
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
      queryCodes: queries,
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
      queryCodes: queries,
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
      queryCodes: queries,
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
      queryCodes: queries,
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
      queryCodes: queries,
    })

    expect(results.length).toBe(1)
  })

  it('should match function with 2 arguments', () => {
    const queries = [`
      ($_ref1, $_ref2) => {}
      `,
    ]

    const results = search({
      mode: 'include',
      filePaths: mockedFilesList,
      queryCodes: queries,
    })
    
    expect(results.length).toBe(2)
  })

  it('should match function with 2 arguments using double wildcard', () => {
    const queries = [`
      ($_ref1, $$_ref2) => {}
      `,
    ]

    const results = search({
      mode: 'include',
      filePaths: mockedFilesList,
      queryCodes: queries,
    })
    
    expect(results.length).toBe(3)
  })

  it('should match function with 3 arguments', () => {
    const queries = [`
      ($_ref1, $_ref2, $_ref3) => {}
      `,
    ]

    const results = search({
      mode: 'include',
      filePaths: mockedFilesList,
      queryCodes: queries,
    })
    
    expect(results.length).toBe(1)
  })


})