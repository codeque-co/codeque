
module.exports = function plugin() {
  console.log('BABEL', process.env.BABEL_ENV)
  if (process.env.BABEL_ENV !== 'production') {
    return {}
  }

  const identifierReplacements = JSON.parse(process.env.BABEL_IDS_REPLACEMENTS)

  return {
    visitor: {
      CallExpression(path, state) {
        if (['log', 'logStepStart', 'logStepEnd'].includes(path.node.callee?.name) || /^measure/.test(path.node.callee?.name)) {
          path.remove()
        }
      },
      VariableDeclaration(path, state) {
        if (/^measure/.test(path.node.declarations[0]?.id?.name)) {
          path.remove()

        }
      },
      Identifier(path) {
        const replacement = identifierReplacements[path.node.name]
        if (typeof replacement === 'string') {
          console.log('Replaced identifier:', path.node.name, '=>', replacement)
          path.node.name = replacement
        }
      },
      StringLiteral(path) {
        if (path.node.value.includes('crate/pkg')) {
          path.node.value = path.node.value.replace('crate', 'crate-prod')
          console.log('Replaced crate import path to:', path.node.value)

        }
      }
    },
  };
}