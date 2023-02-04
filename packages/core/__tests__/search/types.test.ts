import { searchInFileSystem } from '/searchInFs'
import path from 'path'
import { getFilesList } from '/getFilesList'
import fs from 'fs'
import { searchInStrings } from '../../src/searchInStrings'

describe('Types', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: path.resolve(__dirname, '__fixtures__'),
      omitGitIgnore: true,
    })
  })

  const tempFilePath = path.join(
    __dirname,
    '__fixtures__',
    `${Date.now()}.temp`,
  )
  const mockFilesList = [tempFilePath]

  beforeAll(() => {
    fs.writeFileSync(
      tempFilePath,
      `
      type ReturnTypeInferer<T> = T extends (a: Record<string, string>) => infer U ? U : never;

      type Generic<T extends B = C> = G

      const getInitialValues = (
        assignment: AssignmentPopulated,
      ): AssignmentFormValues => {
        if (!assignment) {
          return undefined;
        }
      };

      useAskToFillInForm<{
        noteFromTeam: string;
      }>({ asd })

      interface A extends B<C | number>{
        key: string;
        key_2: number;
      }

      interface B {
        key: string;
        key_2?: number;
      }

    `,
    )
  })

  afterAll(() => {
    fs.unlinkSync(tempFilePath)
  })

  it('should match type that concatenates other type', () => {
    const queries = [
      `
      type $$ = ScrollViewProps & $$$
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match type concatenation with one wildcard with not matching order', () => {
    const queries = [
      `
      type $$ = $$$ & ScrollViewProps
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match string enumeration type with exact mode', () => {
    const queries = [
      `
      type $$ = "$$" | "$$"
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match string enumeration type with include mode', () => {
    const queries = [
      `
      type $$ = "$$" | "$$"
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(3)
  })

  it('should match generic type parametrization', () => {
    const queries = [
      `
        type $$ = {
          $$: $$<$$$>;
        };     
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(5)
  })

  it('should match indexed object type with wildcard', () => {
    const queries = [
      `
      type $$ = {
        [key: string]: $$$;
      };   
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match some indexed object type with partially wildcard identifier', () => {
    const queries = [
      `
      type $$Visibility = {
        [key: string]: boolean | undefined
      };   
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match some indexed object type', () => {
    const queries = [
      `
      type $$ = {
        [key: $$]: $$$
      };   
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match types union inside indexed object type', () => {
    const queries = [
      `
      type $$ = {
        [key: string]: boolean | $$;
      };   
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match some random generic type', () => {
    const queries = [
      `
      type ReturnTypeInferer<T> = T extends (a: Record<string, string>) => infer U ? U : never; 
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match wildcard as generic param', () => {
    const queries = [
      `
      type ReturnTypeInferer<$$> = $$ extends (a: Record<string, string>) => infer U ? U : never; 
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match wildcard as conditional extends part', () => {
    const queries = [
      `
      type ReturnTypeInferer<$$> = $$ extends $$$ ? U : never; 
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match wildcard in conditional type', () => {
    const queries = [
      `
      type $$<T> = T extends $$$ ? $$ : $$
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match wildcard as conditional type', () => {
    const queries = [
      `
      type $$<T> = $$$
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match type parameter wildcard', () => {
    const queries = [
      `
        type $$<$$$> = G
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match function declaration with returnType by query without returnType', () => {
    const queries = [
      `
        const getInitialValues = (
          assignment: AssignmentPopulated,
        ) => {
        
        };
       `,
    ]

    const { matches: matchesInclude, errors: errorsInclude } =
      searchInFileSystem({
        mode: 'include',
        filePaths: mockFilesList,
        queryCodes: queries,
      })

    const { matches: matchesExact, errors: errorsExact } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(matchesInclude.length).toBe(1)
    expect(matchesExact.length).toBe(0)
    expect(errorsExact.length).toBe(0)
    expect(errorsInclude.length).toBe(0)
  })

  it('should match function declaration with param typeAnnotation by query without param typeAnnotation', () => {
    const queries = [
      `
        const getInitialValues = (
          assignment,
        ): AssignmentFormValues => {
        
        };
       `,
    ]

    const { matches: matchesInclude, errors: errorsInclude } =
      searchInFileSystem({
        mode: 'include',
        filePaths: mockFilesList,
        queryCodes: queries,
      })

    const { matches: matchesExact, errors: errorsExact } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(matchesInclude.length).toBe(1)
    expect(matchesExact.length).toBe(0)
    expect(errorsExact.length).toBe(0)
    expect(errorsInclude.length).toBe(0)
  })

  it('should match function declaration with types by query without types', () => {
    const queries = [
      `
        const getInitialValues = (
          assignment,
        ) => {
        
        };
       `,
    ]

    const { matches: matchesInclude, errors: errorsInclude } =
      searchInFileSystem({
        mode: 'include',
        filePaths: mockFilesList,
        queryCodes: queries,
      })

    const { matches: matchesExact, errors: errorsExact } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(matchesInclude.length).toBe(1)
    expect(matchesExact.length).toBe(0)
    expect(errorsExact.length).toBe(0)
    expect(errorsInclude.length).toBe(0)
  })

  it('should match call expression with typesParameters by query without typesParameters', () => {
    const queries = [
      `
        use$$Form$$()
       `,
    ]

    const { matches: matchesInclude, errors: errorsInclude } =
      searchInFileSystem({
        mode: 'include',
        filePaths: mockFilesList,
        queryCodes: queries,
      })

    const { matches: matchesExact, errors: errorsExact } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(matchesInclude.length).toBe(1)
    expect(matchesExact.length).toBe(0)
    expect(errorsExact.length).toBe(0)
    expect(errorsInclude.length).toBe(0)
  })

  it('should match some interface', () => {
    const queries = [
      `
        interface $$ {
          $$_ref1: string
        }
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match interface with wildcard in extends', () => {
    const queries = [
      `
        interface A extends $$$ {
        }
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match interface with wildcard in extends with type param', () => {
    const queries = [
      `
        interface A extends $$<$$$> {
        }
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match interface with extends with double wildcard', () => {
    const queries = [
      `
        interface $$$ {

        }
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
  })

  it('should match optional interface filed in include mode 1', () => {
    const queries = [
      `
        interface B {
          key_2: number;
        }
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match optional interface filed in include mode 2', () => {
    const queries = [
      `
        interface B {
          key_2?: number;
        }
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match optional interface filed in exact mode', () => {
    const queries = [
      `
        interface B {
          key:string;
          key_2?: number;
        }
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should not match optional interface filed in exact mode if not marked as optional', () => {
    const queries = [
      `
        interface B {
          key:string;
          key_2: number;
        }
       `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: mockFilesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(0)
    expect(errors.length).toBe(0)
  })

  it('Should match type in variable type annotation', () => {
    const fileContent = `
      const a: SomeType = '';
      let b: SomeType = '';
      let c: OtherType & { key: SomeType } = '';
    `

    const queries = [
      `
      SomeType
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

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(3)
  })

  it('Should match type in function parameter type annotation', () => {
    const fileContent = `
      function A(a: SomeType) {};
      const B = (b: SomeType) => {};
      function async (a: OtherType & SomeType) {};
    `

    const queries = [
      `
      SomeType
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

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(3)
  })
})
