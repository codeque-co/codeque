module.exports = function plugin() {
  console.log('BABEL', process.env.BABEL_ENV)

  if (process.env.BABEL_ENV !== 'production') {
    return {}
  }

  const keepMetrics = process.env.BABEL_ENV === 'production_performance'

  return {
    visitor: {
      CallExpression(path, state) {
        const calleeName = path.node.callee?.name

        if (
          ['log', 'logStepStart', 'logStepEnd'].includes(calleeName) ||
          (!keepMetrics && /^measure/.test(calleeName))
        ) {
          console.log('removed', `${calleeName}()`)
          path.remove()
        }
      },
      ImportDeclaration(path, state) {
        const sourceName = path.node.source.value

        if (!keepMetrics && sourceName === 'perf_hooks') {
          console.log('removed', `import $$ from "${sourceName}"`)
          path.remove()
        }
      },
      VariableDeclaration(path, state) {
        const identifier = path.node.declarations[0]?.id?.name

        if (!keepMetrics && /^measure/.test(identifier)) {
          console.log('removed', `const/let/var ${identifier}`)

          path.remove()
        }
      },
      ObjectProperty(path) {
        const identifier = path.node.key.name

        if (!keepMetrics && /^measure/.test(identifier)) {
          console.log('removed', `ObjectProperty ${identifier}`)

          path.remove()
        }
      },
    },
  }
}
