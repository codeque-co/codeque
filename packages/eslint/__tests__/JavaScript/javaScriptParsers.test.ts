import { rules } from '../../src/index'
import { RuleOption } from '../../src/types'

const codeWithoutMatches = `
  // Different order of keys
  const obj = {
    prop10: 'World',
    prop8: [
      { value: 'C', id: 3 },
      { id: 4, value: 'D' },
    ],
  }

  {
    const a = 1 === 0
    class A {}
  }

  const Comp = () => (<div>not-test</div>);

  \`pre-not\${value}
  
  post\`
`

const codeWithMatches = `
  const obj = {
    prop1: 'Hello',
    prop2: 42,
    prop3: true,
    prop4: [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ],
    prop5: {
      prop6: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' },
      ],
      prop7: {
        prop8: [
          { id: 3, value: 'C' },
          { id: 4, value: 'D' },
        ],
        prop10: 'World',
      },
    },
  }

  {
    const a = 1 === 0
    fn(obj)
    fn(newobj)
    class A {}
  }

  const result = obj.key.fn()

  functionCall(obj.key.fn())

  obj.prop1.prop2.prop3

  const Comp = () => (<div>test</div>);

  \`pre\${value}
  
  post\`

`

describe('JavaScript code samples', () => {
  describe('nested exact query', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `({
            prop8: [
              { id: 3, value: 'C' },
              { id: 4, value: 'D' },
            ],
            prop10: 'World',
          })`,
          mode: 'exact',
        },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: codeWithoutMatches,
          options,
        },
      ],
      invalid: [
        {
          code: codeWithMatches,
          options,
          errors: [
            {
              message: 'Restricted code pattern',
              line: 15,
              column: 14,
              endLine: 21,
              endColumn: 8,
            },
          ],
        },
      ],
    })
  })

  describe('nested include query', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `({
            prop3: true,
            prop4: [
              {  age: 25 },
            ],
            prop5: {
              prop7: {
                prop8: [
                  { id: 3, },
                ],
              },
            },
          })`,
          mode: 'include',
        },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: codeWithoutMatches,
          options,
        },
      ],
      invalid: [
        {
          code: codeWithMatches,
          options,
          errors: [
            {
              message: 'Restricted code pattern',
              line: 2,
              column: 15,
              endLine: 23,
              endColumn: 4,
            },
          ],
        },
      ],
    })
  })

  describe('nested include-with-order query', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `({
            prop8: [
              { id: 3, value: 'C' },
              { id: 4 },
            ],
            prop10: 'World',
          })`,
          mode: 'include-with-order',
        },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: codeWithoutMatches,
          options,
        },
      ],
      invalid: [
        {
          code: codeWithMatches,
          options,
          errors: [
            {
              message: 'Restricted code pattern',
              line: 15,
              column: 14,
              endLine: 21,
              endColumn: 8,
            },
          ],
        },
      ],
    })
  })

  describe('multiline include query', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `
            const obj = {}

            {
              fn(obj)
            }
          `,
          mode: 'include',
        },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: codeWithoutMatches,
          options,
        },
      ],
      invalid: [
        {
          code: codeWithMatches,
          options,
          errors: [
            {
              message: 'Restricted code pattern',
              line: 2,
              column: 3,
              endLine: 30,
              endColumn: 4,
            },
          ],
        },
      ],
    })
  })

  describe('multiline include query with identifier alias', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `
            const $$_ref1 = {}

            {
              fn(new$$_ref1_)
            }
          `,
          mode: 'include',
        },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: codeWithoutMatches,
          options,
        },
      ],
      invalid: [
        {
          code: codeWithMatches,
          options,
          errors: [
            {
              message: 'Restricted code pattern',
              line: 2,
              column: 3,
              endLine: 30,
              endColumn: 4,
            },
          ],
        },
      ],
    })
  })

  describe('multiline include query with nodes tree wildcard alias', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `
            const result = $$$_chainExp

            functionCall($$$_chainExp)
          `,
          mode: 'include',
        },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: codeWithoutMatches,
          options,
        },
      ],
      invalid: [
        {
          code: codeWithMatches,
          options,
          errors: [
            {
              message: 'Restricted code pattern',
              line: 32,
              column: 3,
              endLine: 34,
              endColumn: 29,
            },
          ],
        },
      ],
    })
  })

  describe('query with JSX', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `
            const Comp = () => <div>test</div>
          `,
          mode: 'include',
        },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: codeWithoutMatches,
          options,
        },
      ],
      invalid: [
        {
          code: codeWithMatches,
          options,
          errors: [
            {
              message: 'Restricted code pattern',
              line: 38,
              column: 3,
              endLine: 38,
              endColumn: 40,
            },
          ],
        },
      ],
    })
  })

  describe('query with multiline template string', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `\`pre
              \${value}
      
              post\`
          `,
          mode: 'include',
        },
      ],
    ]

    global.ruleTester.run('@codeque', rules.error, {
      valid: [
        {
          code: codeWithoutMatches,
          options,
        },
      ],
      invalid: [
        {
          code: codeWithMatches,
          options,
          errors: [
            {
              message: 'Restricted code pattern',
              line: 40,
              column: 3,
              endLine: 42,
              endColumn: 8,
            },
          ],
        },
      ],
    })
  })

  if (!(global.ruleTester as any).testerConfig.parser.includes('esprima')) {
    describe('optional chaining query that matches normal chaining', () => {
      const options: [Array<RuleOption>] = [
        [
          {
            query: `
            obj?.prop1?.prop2?.prop3
          `,
            mode: 'include',
          },
        ],
      ]

      global.ruleTester.run('@codeque', rules.error, {
        valid: [
          {
            code: codeWithoutMatches,
            options,
          },
        ],
        invalid: [
          {
            code: codeWithMatches,
            options,
            errors: [
              {
                message: 'Restricted code pattern',
                line: 36,
                column: 3,
                endLine: 36,
                endColumn: 24,
              },
            ],
          },
        ],
      })
    })
  }
})
