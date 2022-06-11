const { diff, detailedDiff } = require('deep-object-diff')

const astPropsToSkip = [
  'loc',
  'start',
  'end',
  'extra',
  'trailingComments',
  'leadingComments',
  'errors',
  'comments',
  'directives'
]

const { parse } = require('@babel/parser')
const { default: generate } = require('@babel/generator')
const parseOptions = {
  sourceType: 'module',
  plugins: ['typescript', 'jsx', 'decorators-legacy'],
  allowReturnOutsideFunction: true
}

const search = `
<A  prop={"$"}/>
`

const replace = `
<A  prop="$"/>
`

const searchParsed = parse(search, parseOptions)

const replaceParsed = parse(replace, parseOptions)
const NodeConstructor = parse('').constructor //TODO: import proper constructor from somewhere

const isNode = (maybeNode) => {
  return maybeNode?.constructor === NodeConstructor
}

const removeAstProps = (node) => {
  astPropsToSkip.forEach((prop) => {
    if (node.hasOwnProperty(prop)) {
      delete node[prop]
    }
  })

  Object.keys(node).forEach((key) => {
    if (Array.isArray(node[key])) {
      node[key].forEach((maybeNode) => {
        if (isNode(maybeNode)) {
          removeAstProps(maybeNode)
        }
      })
    } else if (isNode(node[key])) {
      removeAstProps(node[key])
    }
  })

  return node
}

removeAstProps(searchParsed)
removeAstProps(replaceParsed)

const diffObj = diff(searchParsed, replaceParsed)
const detailedDiffObj = detailedDiff(searchParsed, replaceParsed)

console.log('search', JSON.stringify(searchParsed, undefined, 2))
console.log('diff', JSON.stringify(diffObj, undefined, 2))
console.log('detailed', JSON.stringify(detailedDiffObj, undefined, 2))

// console.log(generate(replaceParsed).code)
