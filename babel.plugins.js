
module.exports = function plugin() {

  if (process.env.NODE_ENV !== 'production') {
    return {}
  }

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
    },
  };
}