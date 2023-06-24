import { searchInStrings } from '../../../src/searchInStrings'

describe('', () => {
  it('should match possible falsy event listeners', () => {
    const fileContent = `
      <div>
        <div
          onClickHandler={some.value && onClickHandler}
        />
        <div
          onClickHandler={some.value && onClickHandler}
        >
        </div>
      </div>
    `

    const queries = [
      `
      <$$
        $$={$$$ && $$$}
      />
    `,
      `
      <$$
        $$={$$$ && $$$}
      >
      </$$>
    `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('should find all JSX props which always creates new reference', () => {
    const fileContent = `
      <div>
        <div
          onClickHandler={() => {}}
        />
        <div
          onClickHandler={[]}
        />
        <div
          onClickHandler={{}}
        >
        </div>
      </div>
    `

    const queries = [
      `
      <$$
        $$={()=>{}}
      />
    `,
      `
      <$$
        $$={[]}
      />
    `,
      `
      <$$
        $$={{}}
      />
    `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(3)
  })
})
