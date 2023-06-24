import { compareCode, parserType } from '../../utils'

import { searchInStrings } from '../../../src/searchInStrings'

describe('JSX', () => {
  const testFileContent = `
    <Fragment>
      <Flex >
    
          <Button
        >
            Press to 
            Download
          </Button>

      </Flex>

      <Button>
        Press to
        Download
      </Button>

      <Button>
        Click
        <Icon />
      </Button>
    </Fragment>
  `

  const mockedFilesList = [
    {
      path: 'mock',
      content: testFileContent,
    },
  ]

  it('Should find JSX by text content regardless formatting', () => {
    const query = `
      <Button>
        Press to 
        Download
      </Button>
    `
    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: mockedFilesList,
      queryCodes: [query],
    })
    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('Should ignore all empty JSXText in search', () => {
    const queries = [
      `
        <$$>
          $$
        </$$>;
    `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: mockedFilesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(3)

    expect(
      compareCode(
        matches[0].code,
        ` <Button>
          Press to 
          Download
        </Button>
      `,
      ),
    ).toBeTruthy()
  })

  it('Should match code with nested JSX when using wildcard on text content', () => {
    const queries = [
      `
        <Button>
          c$$$
        </Button>
    `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      caseInsensitive: true,
      files: mockedFilesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)

    expect(
      compareCode(
        matches[0].code,
        ` <Button>
        Click
        <Icon />
      </Button>
      `,
      ),
    ).toBeTruthy()
  })

  describe('Self and not self closing JSX tags in include mode', () => {
    it('Self-closing JSX tag in query should match also not self-closing tags', () => {
      const fileContent = `
      <Comp>asd</Comp>;
      <Comp filed={5}>bbc</Comp>;
      
      <Comp/>;
      <Comp prop="val"/>
    
    `

      const queries = [
        `
      <Comp />
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
    })

    it('Not self-closing JSX tag in query should match also self-closing tags', () => {
      const fileContent = `
        <Comp>asd</Comp>;
        <Comp filed={5}>bbc</Comp>;
        
        <Comp/>;
        <Comp prop="val"/>
      
      `

      const queries = [
        `
        <Comp></Comp>
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
    })

    it('Not self-closing JSX tag with children in query should not match self-closing tags', () => {
      const fileContent = `  
      <Comp/>;
      <Comp prop="val"/>
    
    `

      const queries = [
        `
      <Comp>asd</Comp>
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

    it('Self-closing JSX tag with prop in query should match also not self-closing tag with prop', () => {
      const fileContent = `
      <Comp>asd</Comp>;
      <Comp filed={5}>bbc</Comp>;
      
      <Comp/>;
      <Comp filed={5}/>
    
    `

      const queries = [
        `
      <Comp filed={5} />
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
    })
  })

  describe('JSXIdentifiers like Identifiers', () => {
    it('Should match JSXIdentifier when looking for Identifier', () => {
      const fileContent = `
        <Comp>asd</Comp>;
      `

      const queries = [
        `
        Comp;
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
    })

    it('Should match JSXIdentifier when looking for Identifier wildcard', () => {
      const fileContent = `
        <Comp>asd</Comp>;
      `

      const queries = [
        `
          Co$$;
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
    })
  })

  it('Should not match too much values using wildcards in JSXText', () => {
    const fileContent = `
      <title>Edit User - App</title>
    `

    const queries = [
      `
        <title>$$| App |$$</title>;
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

  if (parserType !== 'esprima') {
    it('Should match empty fragment tag', () => {
      const fileContent = `
      <><A></A></>
    `

      const queries = [
        `
        <></>
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
  }
})
