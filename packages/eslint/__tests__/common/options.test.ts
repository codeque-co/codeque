import { rules } from '../../src/index'
import { RuleOption } from '../../src/types'

describe('Rule options tests', () => {
  const rootPath = process.cwd()

  describe('should run config with default error messages', () => {
    const options: [Array<RuleOption>] = [[{ query: `invalidIdentifier` }]]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [{ code: 'validIdentifier', options }],
      invalid: [
        {
          code: 'invalidIdentifier',
          options,
          errors: ['Restricted code pattern'],
        },
      ],
    })
  })

  describe('should run config with multiple queries', () => {
    const options: [Array<RuleOption>] = [
      [{ query: `invalidIdentifier` }, { query: 'otherInvalidIdentifier' }],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [{ code: 'validIdentifier', options }],
      invalid: [
        {
          code: 'invalidIdentifier;otherInvalidIdentifier',
          options,
          errors: ['Restricted code pattern', 'Restricted code pattern'],
        },
      ],
    })
  })

  describe('should run config with custom error messages', () => {
    const options: [Array<RuleOption>] = [
      [
        { query: `invalidIdentifier` },
        { query: 'otherInvalidIdentifier', message: "Don't use this code" },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [{ code: 'validIdentifier', options }],
      invalid: [
        {
          code: 'invalidIdentifier;otherInvalidIdentifier',
          options,
          errors: ['Restricted code pattern', "Don't use this code"],
        },
      ],
    })
  })

  describe('should run config with include file paths filter', () => {
    const options: [Array<RuleOption>] = [
      [{ query: `invalidIdentifier`, includeFiles: ['**/includeDir/file.*'] }],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: 'invalidIdentifier',
          filename: rootPath + '/path/to/dir/file.js',
          options,
        },
      ],
      invalid: [
        {
          code: 'invalidIdentifier',
          filename: rootPath + '/path/to/includeDir/file.js',
          options,
          errors: ['Restricted code pattern'],
        },
      ],
    })
  })

  describe('should run config with exclude file paths filter', () => {
    const options: [Array<RuleOption>] = [
      [{ query: `invalidIdentifier`, excludeFiles: ['**/excludeDir/file.*'] }],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: 'invalidIdentifier',
          filename: rootPath + '/path/to/excludeDir/file.js',
          options,
        },
      ],
      invalid: [
        {
          code: 'invalidIdentifier',
          filename: rootPath + '/path/to/dir/file.js',
          options,
          errors: ['Restricted code pattern'],
        },
      ],
    })
  })

  describe('should run config with include and exclude file paths filter', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `invalidIdentifier`,
          excludeFiles: ['**/excludeDir/**/file.*'],
          includeFiles: ['**/includeDir/**/file.*'],
        },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: 'invalidIdentifier',
          filename: rootPath + '/includeDir/excludeDir/file.js',
          options,
        },
        {
          code: 'invalidIdentifier',
          filename: rootPath + '/otherDir/excludeDir/file.js',
          options,
        },
      ],
      invalid: [
        {
          code: 'invalidIdentifier',
          filename: rootPath + '/includeDir/otherDir/file.js',
          options,
          errors: ['Restricted code pattern'],
        },
      ],
    })
  })

  describe('should run config with queries with different search modes', () => {
    describe('include mode', () => {
      const options: [Array<RuleOption>] = [
        [
          {
            query: `({ key: 'value' })`,
            mode: 'include',
          },
          {
            query: `({ key: 'value' })`,
            // assert default include mode
          },
        ],
      ]

      global.ruleTester.run('@codeque', rules.error, {
        valid: [
          {
            code: `const obj = { kkk: 'value' }`,
            options,
          },
        ],
        invalid: [
          {
            code: `const obj = { key: 'value', key2: 0 }`,
            options,
            errors: ['Restricted code pattern', 'Restricted code pattern'],
          },
        ],
      })
    })

    describe('exact mode', () => {
      const options: [Array<RuleOption>] = [
        [
          {
            query: `({ key: 'value' })`,
            mode: 'exact',
          },
        ],
      ]

      global.ruleTester.run('@codeque', rules.error, {
        valid: [
          {
            code: `const obj = { kkk: 'value' }`,
            options,
          },
          {
            code: `const obj = { key: 'value', key2: 0 }`,
            options,
          },
        ],
        invalid: [
          {
            code: `const obj = { key: 'value' }`,
            options,
            errors: ['Restricted code pattern'],
          },
        ],
      })
    })

    describe('include-with-order mode', () => {
      const options: [Array<RuleOption>] = [
        [
          {
            query: `({ key1: 'value', key2: 'value2' })`,
            mode: 'include-with-order',
          },
        ],
      ]

      global.ruleTester.run('@codeque', rules.error, {
        valid: [
          {
            code: `const obj = { key1: 'value' }`,
            options,
          },
          {
            code: `const obj = { key2: 'value2',  key1: 'value' }`,
            options,
          },
        ],
        invalid: [
          {
            code: `const obj = { key1: 'value', key2: 'value2' }`,
            options,
            errors: ['Restricted code pattern'],
          },
        ],
      })
    })

    describe('text (unsupported)', () => {
      const options: [Array<RuleOption>] = [
        [
          {
            query: `key1: 'value'`,
            mode: 'text',
          },
        ],
      ]

      expect(() => {
        // @ts-ignore we don't need all props for this test
        rules.error.create({
          options: options,
          // @ts-ignore we don't need all props for this test
          getSourceCode: jest.fn(() => ({ text: '' })),
          getPhysicalFilename: jest.fn(),
          getCwd: jest.fn(),
          parserPath:
            'project/node_modules/@typescript-eslint/parser/dist/index.js',
        })
      }).toThrowError('"Text" search mode is not supported.')
    })
  })

  describe('should run config with case sensitive and insensitive queries', () => {
    describe('case sensitive', () => {
      const options: [Array<RuleOption>] = [
        [
          {
            query: `invalidIdentifier`,
            mode: 'include',
            caseInsensitive: false,
          },
        ],
      ]

      global.ruleTester.run('@codeque', rules.error, {
        valid: [
          {
            code: `validIdentifier`,
            options,
          },
          {
            code: `invalididentifier`,
            options,
          },
        ],
        invalid: [
          {
            code: `invalidIdentifier`,
            options,
            errors: ['Restricted code pattern'],
          },
        ],
      })
    })

    describe('case insensitive', () => {
      const options: [Array<RuleOption>] = [
        [
          {
            query: `invalidIdentifier`,
            mode: 'include',
            caseInsensitive: true,
          },
          {
            query: `invalidIdentifier`,
            mode: 'include',
            // assert default case insensitive
          },
        ],
      ]

      global.ruleTester.run('@codeque', rules.error, {
        valid: [
          {
            code: `validIdentifier`,
            options,
          },
        ],
        invalid: [
          {
            code: `invalididentifier`,
            options,
            errors: ['Restricted code pattern', 'Restricted code pattern'],
          },
          {
            code: `invalidIdentifier`,
            options,
            errors: ['Restricted code pattern', 'Restricted code pattern'],
          },
        ],
      })
    })
  })
})
