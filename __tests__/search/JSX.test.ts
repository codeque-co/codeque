import { search } from '/search'
import { compareCode } from '/astUtils';

describe('JSX', () => {
  it('Should compare ast', () => {
    expect(compareCode(`console\n.log(a)`, 'console.log(a)')).toBe(true)
  })
})