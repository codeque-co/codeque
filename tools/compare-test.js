const { diff, detailedDiff } = require('deep-object-diff')

const astPropsToSkip = ['loc', 'start', 'end', 'extra', 'trailingComments', 'leadingComments', 'errors', 'comments', 'directives']

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
    }
    else if (isNode(node[key])) {
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

/**
 * How to replace?
 * 
 * 1. We have to treat each body item in query as a sub-query, join them with logical 'AND'
 *    - sub-queries would be required only for non-exact mode
 *    - we should treat all block nested block statements similarly to sub-queries 
 *      - we cannot relay on index number e.g to delete a node from body, since actual file body might have more elements than query
 * 2. For each sub-query we generate hash, and we add that hash into file AST to mark node as "to replace" and link to the sub-query
 * 3. For each replacement sub-query we generate the same hash (hash has to be deterministic)
 * 4. We generate a diff for each sub-query
 *    - diff should be agnostic to custom matchers ($nested, $jsx etc.)
 *        - think of cases where it wouldn't be, maybe some $or $and $not ??
 *        - there should be a rule that you cannot change custom matchers in the "replace"
 *            - same applies to wildcard matches
 *              - maybe somehow we could support replacements in partial wildcards
 *                - like `some-path/$` to `new-path/$`
 *                - that's for later, can be done with regex, seems not be often used 
 *    - There are problems
 *       - what if a given subquery would be totally removed?
 *          - maybe we should have remove()
 *       - what if a given subquery is totally new?
 *          - maybe we should have $add()
 *       - similar problem occurs in nested block statements
 * 5. Once we have a diff (to add, to delete, to update) we should find node in file with hash matching the subquery hash
 * 6. We start to traverse the code to apply diff changes
 *    - since we are based on the diff we don't touch any props that are outside of the search match
 *    - we should take into consideration, that there would almost always be nodes nested to our query
 *      - eg. nested JSX in our diff which we cannot remove, some object expressions
 * 
 * Important note: Implementing replace for non-exact mode would be super hard
 *   - we would need custom diff algorithm to detect removal of some intermediate nodes
 *     - eg. removing <Box> from <Flex><Box><Text>Abc</Text></Box></Flex>
 *     - if <Text> contains some additional props not listed in query, we would just remove them with deep-object-diff based approach
 *     - need to think of how to reconcile that kind of change
 *     - needs custom diff algorithm that would traverse removed path to find a node with matching shape
 *       - matching shape means matching identifiers ??? maybe similar to how validateMatch works for different types
 *       - maybe it should run another deep-object-diff if it would find node with matching type
 *         - that could work 
 *         - we could call it 'replace with linked node' or 'short circuit node' or 'remove intermediate node'
 *     - case with removal of an if () {} but keeping part of block content. 
 *        - we should handle that so we need to check if removal was done in block context (or maybe more generic in nodes array)
 * Next steps 
 * 1. Implement a PoC with just one sub query for exact mode
 */