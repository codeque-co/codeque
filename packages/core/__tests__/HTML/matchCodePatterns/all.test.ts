import { searchInStrings } from '../../../src/searchInStrings'

describe('Basic queries', () => {
  const fileContent = `<html>
      <div>
        <div class="test" style="color:red;">
          <p>Some text</p>
        </div>
        <div> 
          <img src="" />
        </div>
      </div>
      <br>
      <p>Some other text</p>
    </html>`

  it('Should match paragraph node', () => {
    const queries = [`<p></p>`]

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

  it('Should match div node with some params', () => {
    const queries = [
      `<div 
        class="test"
      ></div>`,
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

  it('Should match div with text node', () => {
    const queries = [`<div><p>Some text</p></div>`]

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

  it('Should not match img if params does not match', () => {
    const queries = [`<img src="test" />`]

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

  it('Should match div node with p node using wildcard', () => {
    const queries = [`<$$><p>Some text</p></$$>`]

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
})
