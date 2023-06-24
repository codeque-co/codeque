import { rules } from '../../src/index'
import { RuleOption } from '../../src/types'

const codeWithoutMatches = `
  
`

const codeWithMatches = `
  const a: SomeType = '';
  let b: SomeType = '';
  let c: OtherType & { key: SomeType } = '';

  interface B {
    key: string;
    key_2?: number;
  }

  const getInitialValues = (
    assignment: AssignmentPopulated,
  ): AssignmentFormValues => {
    if (!assignment) {
      return undefined;
    }
  };
`

describe('TypeScript code samples', () => {
  describe('should match optional interface filed in include mode with query without optional interface', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `
            interface B {
              key_2: number;
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
              line: 6,
              column: 3,
              endLine: 9,
              endColumn: 4,
            },
          ],
        },
      ],
    })
  })

  describe('Should match type in variable type annotation', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `SomeType`,
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
              column: 12,
              endLine: 2,
              endColumn: 20,
            },
            {
              message: 'Restricted code pattern',
              line: 3,
              column: 10,
              endLine: 3,
              endColumn: 18,
            },
            {
              message: 'Restricted code pattern',
              line: 4,
              column: 29,
              endLine: 4,
              endColumn: 37,
            },
          ],
        },
      ],
    })
  })

  describe('should match function declaration with types by query without types', () => {
    const options: [Array<RuleOption>] = [
      [
        {
          query: `
            const getInitialValues = (
              assignment,
            ) => {
            
            };
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
              line: 11,
              column: 3,
              endLine: 17,
              endColumn: 5,
            },
          ],
        },
      ],
    })
  })
})
