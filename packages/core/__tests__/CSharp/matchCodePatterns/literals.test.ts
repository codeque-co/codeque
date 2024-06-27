import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings } from '../../utils'

describe('Literals', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should match string literal', () => {
    const fileContent = `
        using System;

        Console.WriteLine("Csharp");
    `

    const queries = [
      `
        "Csharp"
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
  })

  it('Should exact match template string literal', () => {
    const fileContent = `
      using System;

      class TestClass
      {
        static void TestPrint()
        {
            var machineId = "id-1234";
            var status = "stopped";
            Console.WriteLine($"Machine {machineId} has {status}.");
        }
      }
    `

    const queries = [
      `
      $"Machine {machineId} has {status}."
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
  })

  it('Should partial match template string literal', () => {
    const fileContent = `
      using System;

      class TestClass
      {
        static void TestPrint()
        {
            var machineId = "id-1234";
            var status = "stopped";
            Console.WriteLine($"Machine {machineId} has {status}.");
        }
      }
    `

    const queries = [
      `
      $"Machine {machineId}."
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
  })

  it('Should match Integer literal', () => {
    const fileContent = `
      class TestClass
      {
        static void TestPrint()
        {
            var simpleInt = 32;
        }
      }
    `

    const queries = [
      `
      32
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
  })

  it('Should match Float literal', () => {
    const fileContent = `
      class TestClass
      {
        static void TestPrint()
        {
            var simpleFloat = 32.0;
        }
      }
    `

    const queries = [
      `
      32.0
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
  })

  it('Should match Hex literal', () => {
    const fileContent = `
      class TestClass
      {
        static void TestPrint()
        {
            var simpleHex = 0x1A2F;
        }
      }
    `

    const queries = [
      `
      0x1A2F
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
  })
})
