import { searchInStrings } from '../../../src/searchInStrings'
import { compareAstToCode, compareCode, parserType } from '../../utils'
import { useTraverseApproachTestOnly } from '../../../src/testOnlyConfig'

describe('Search with context', () => {
  it('Should match code with wildcard alias in search query', () => {
    const fileContent = `
      const someVar = 5

      someFunction(someVar);

    `

    const queries = [
      `
      const $$_ref1 = 5

      someFunction($$_ref1);
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'someVar',
    )
  })

  it('Should match code with wildcard alias in the middle of identifier', () => {
    const fileContent = `
      const preMatchedPost = 5

      someFunction(preMatchedPost);

    `

    const queries = [
      `
      const pre$$_ref1_Post = 5

      someFunction(pre$$_ref1_Post);
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'Matched',
    )
  })

  it('Should match code with wildcard alias in the middle of identifier when only the wildcard is used in subsequent statement', () => {
    const fileContent = `
      const preMatchedPost = 5

      someFunction(Matched);

    `

    const queries = [
      `
      const pre$$_ref1_Post = 5

      someFunction($$_ref1);
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'Matched',
    )
  })

  it('Should match code with 2 wildcard aliases in the middle of identifier when wildcard aliases and new chars creates an id in subsequent statement where wildcards are separated by other chars', () => {
    const fileContent = `
      const preMatchedPostNext = 5

      someFunction(NewMatchedValueNext);

    `

    const queries = [
      `
      const pre$$_ref1_Post$$_ref2 = 5

      someFunction(New$$_ref1_Value$$_ref2_);
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'Matched',
    )

    expect(matches[0].aliases.identifierAliasesMap['ref2'].aliasValue).toBe(
      'Next',
    )
  })

  it('Should match code with 1 partial wildcard alias in identifier with subsequent statement that uses that alias in other variable name', () => {
    const fileContent = `
      const preMatched = 5

      someFunction(NewMatched);

    `

    const queries = [
      `
      const pre$$_ref1 = 5

      someFunction(New$$_ref1);
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'Matched',
    )
  })

  it('Should match code with 1 partial wildcard alias in identifier with subsequent statement inside new block that uses that alias in other variable name', () => {
    const fileContent = `
      const preMatched = 5;

      {
        const a = b;
        someFunction(NewMatched);
        class A {}
      }

    `

    const queries = [
      `
      const pre$$_ref1 = 5
      
      {
        someFunction(New$$_ref1);
      }
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'Matched',
    )
  })

  it('Should not match code with 2 wildcard aliases in the middle of identifier when wildcard aliases and new chars creates an id in subsequent statement where wildcards are next to each other', () => {
    const fileContent = `
      const preMatchedPostNext = 5

      someFunction(NewMatchedNextValue);

    `

    const queries = [
      `
      const pre$$_ref1_Post$$_ref2 = 5

      someFunction(New$$_ref1_$$_ref2_Value); // 👈 this is invalid wildcard
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
    expect(matches.length).toBe(0)
  })

  it('Should match code with wildcard alias case insensitive', () => {
    const fileContent = `
      const preMatchedPost = 5

      someFunction(prematchedPost);

    `

    const queries = [
      `
      const pre$$_ref1_Post = 5

      someFunction(pre$$_ref1_Post);
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'Matched',
    )
  })

  it('Should match code with wildcard alias case sensitive', () => {
    const fileContent = `
      const preMatchedPost = 5

      someFunction(preMatchedPost);

    `

    const queries = [
      `
      const pre$$_ref1_Post = 5

      someFunction(pre$$_ref1_Post);
     `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      caseInsensitive: false,
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'Matched',
    )
  })

  it('Should not match code with wildcard alias case sensitive', () => {
    const fileContent = `
      const preMatchedPost = 5

      someFunction(prematchedPost);

    `

    const queries = [
      `
      const pre$$_ref1_Post = 5

      someFunction(pre$$_ref1_Post);
     `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      caseInsensitive: false,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(0)
  })

  it('Should alias nodes tree', () => {
    const fileContent = `
      someFunction((param) => {
        const a = 6
        return a + param
      });
    `

    const queries = [
      `
      someFunction($$$_ref1);
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

    expect(
      compareAstToCode(
        matches[0].aliases.nodesTreeAliasesMap['ref1'].aliasNode,
        `(param) => {
          const a = 6
          return a + param
        }`,
      ),
    ).toBe(true)

    expect(
      compareCode(
        matches[0].aliases.nodesTreeAliasesMap['ref1'].aliasValue,
        `(param) => {
          const a = 6
          return a + param
        }`,
      ),
    ).toBe(true)
  })

  it('Should alias nodes tree with camelCase alias name', () => {
    const fileContent = `
      someFunction((param) => {
        const a = 6
        return a + param
      });
    `

    const queries = [
      `
      someFunction($$$_someRef);
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

    expect(
      compareAstToCode(
        matches[0].aliases.nodesTreeAliasesMap['someRef'].aliasNode,
        `(param) => {
          const a = 6
          return a + param
        }`,
      ),
    ).toBe(true)

    expect(
      compareCode(
        matches[0].aliases.nodesTreeAliasesMap['someRef'].aliasValue,
        `(param) => {
          const a = 6
          return a + param
        }`,
      ),
    ).toBe(true)
  })

  it('Should match aliased nodes tree in subsequent statements', () => {
    const fileContent = `
      someFunction(() => 5);

      someOtherFunction(() => 5);
    `

    const queries = [
      `
      someFunction($$$_ref1);

      someOtherFunction($$$_ref1);

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

    expect(
      compareAstToCode(
        matches[0].aliases.nodesTreeAliasesMap['ref1'].aliasNode,
        '() => 5',
      ),
    ).toBe(true)

    expect(
      compareCode(
        matches[0].aliases.nodesTreeAliasesMap['ref1'].aliasValue,
        '() => 5',
      ),
    ).toBe(true)
  })

  it('Should not match aliased nodes tree in subsequent statements if they are different', () => {
    const fileContent = `
      someFunction(() => 5);

      someOtherFunction(() => 555);
    `

    const queries = [
      `
      someFunction($$$_ref1);

      someOtherFunction($$$_ref1);

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
    expect(matches.length).toBe(0)
  })

  it('Should not match code with wildcard alias in search query if wildcard alias does not match', () => {
    const fileContent = `
      const someVar = 5

      someFunction(someOtherVar);

    `

    const queries = [
      `
      const $$_ref1 = 5

      someFunction($$_ref1);
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
    expect(matches.length).toBe(0)
  })

  it('aliased matches should not interferer in different code paths', () => {
    const fileContent = `
      const someVar = 5

      someFunction(someVar);

      function Sth() {
        const someOtherVar = 5

        someFunction(someOtherVar);
      }

    `

    const queries = [
      `
      const $$_ref1 = 5

      someFunction($$_ref1);
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
    expect(matches.length).toBe(2)

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'someVar',
    )

    expect(matches[1].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'someOtherVar',
    )
  })

  it('Should match aliased id wildcard in nested function calls when aliased id is the same', () => {
    const fileContent = `
      someFn(
        param,
        someOtherFn(param),
      )
    `

    const queries = [
      `
      someFn(
        $$_ref1,
        someOtherFn($$_ref1),
      )
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'param',
    )
  })

  it('Should not match aliased id wildcard in nested function calls when aliased id is not the same', () => {
    const fileContent = `
      someFn(
        param,
        someOtherFn(param2),
      )
    `

    const queries = [
      `
      someFn(
        $$_ref1,
        someOtherFn($$_ref1),
      )
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
    expect(matches.length).toBe(0)
  })

  // This is not always desired, but can be worked around with query builder
  // Test to assert that behavior
  it('Should match first alias of two possible identifiers for given level', () => {
    const fileContent = `
      import { FlexProps, BoxProps} from '@ui/layout'
    `

    const queries = [
      `
       import { $$_prefix_Props } from '@ui/layout' 
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

    expect(matches[0].aliases.identifierAliasesMap['prefix'].aliasValue).toBe(
      'Flex',
    )
  })

  it('should get pre and post aliased wildcards while pre is empty', () => {
    const fileContent = `
      ConsultantsSearchService
    `

    const queries = [`$$_pre_Consultant$$_post`]

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
    expect(matches[0].aliases.identifierAliasesMap['pre'].aliasValue).toBe('')

    expect(matches[0].aliases.identifierAliasesMap['post'].aliasValue).toBe(
      'sSearchService',
    )
  })

  it('should get pre and post aliased wildcards with case insensitive mode', () => {
    const fileContent = `
      CustomConsultantsSearchService
    `

    const queries = [`$$_pre_consultant$$_post`]

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

    expect(matches[0].aliases.identifierAliasesMap['pre'].aliasValue).toBe(
      'Custom',
    )

    expect(matches[0].aliases.identifierAliasesMap['post'].aliasValue).toBe(
      'sSearchService',
    )
  })

  it('should match aliased string wildcard', () => {
    const fileContent = `
      const someString = 'pre-content-post'

      someFunction('content');
    `

    const queries = [
      `
      const someString = 'pre-$$_ref1_-post'

      someFunction('$$_ref1_');
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

    expect(matches[0].aliases.stringAliasesMap['ref1'].aliasValue).toBe(
      'content',
    )
  })

  it('should match aliased string wildcard between string literal and template string', () => {
    const fileContent = `
      const someString = 'pre-content-post'

      someFunction(\`content\`);
    `

    const queries = [
      `
      const someString = 'pre-$$_ref1_-post'

      someFunction(\`$$_ref1_\`);
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

    expect(matches[0].aliases.stringAliasesMap['ref1'].aliasValue).toBe(
      'content',
    )
  })

  it('should match aliased string wildcard between string literal and identifier', () => {
    const fileContent = `
      const someString = 'pre-content-post'

      someFunction(content);
    `

    const queries = [
      `
      const someString = 'pre-$$_ref1_-post'

      someFunction($$_ref1);
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

    expect(matches[0].aliases.stringAliasesMap['ref1'].aliasValue).toBe(
      'content',
    )
  })

  it('should match aliased identifier wildcard between identifier and string literal', () => {
    const fileContent = `
      const preContentPost = 5

      someFunction('content');
    `

    const queries = [
      `
      const pre$$_ref1_Post = 5

      someFunction('$$_ref1');
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'Content',
    )
  })

  if (global.testSettings?.isTraversal) {
    // In traversal we only project any node wildcard query to identifiers (for now)
    it('should match any node tree many times and produce many aliases', () => {
      const fileContent = `
        someFunction('content');
      `

      const queries = [
        `
        $$$_ref
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

      expect(
        matches[0].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`someFunction`)
    })
  } else if (parserType === 'esprima' || parserType === 'espree') {
    // Esprima and espree do not have top level File node, hence it matches one node less

    it('should match any node tree many times and produce many aliases', () => {
      const fileContent = `
        someFunction('content');
      `

      const queries = [
        `
        $$$_ref
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
      expect(matches.length).toBe(4)

      expect(
        matches[0].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`someFunction('content');`)

      expect(
        matches[1].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`someFunction('content')`)

      expect(
        matches[2].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`someFunction`)

      expect(
        matches[3].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`'content'`)
    })
  } else {
    it('should match any node tree many times and produce many aliases', () => {
      const fileContent = `
        someFunction('content');
      `

      const queries = [
        `
        $$$_ref
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
      expect(matches.length).toBe(5)

      expect(
        matches[0].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`someFunction('content');`)

      expect(
        matches[1].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`someFunction('content');`)

      expect(
        matches[2].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`someFunction('content')`)

      expect(
        matches[3].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`someFunction`)

      expect(
        matches[4].aliases.nodesTreeAliasesMap['ref'].aliasValue.trim(),
      ).toBe(`'content'`)
    })
  }

  it('should not bind wildcard alias to first encounter partially matching pattern, if rest of the node is not matched', () => {
    const fileContent = `
      (() => {
          function func1() {
            1
          }
          function func2() {
            2
          }
      })()
    `

    const queries = [
      `
        (() => {
          function $$_ref1() {
              2
          }
        })();
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

    expect(matches[0].aliases.identifierAliasesMap['ref1'].aliasValue).toBe(
      'func2',
    )
  })
})
