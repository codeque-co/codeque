module.exports = function plugin() {
  const babelEnv = process.env.BABEL_ENV
  console.log('BABEL_ENV', babelEnv)

  if (babelEnv !== 'production' && babelEnv !== 'test') {
    return {}
  }

  const keepMetrics = babelEnv === 'production_performance'
  const keepTestFns = babelEnv === 'test'

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
        const declaration = path.node.declarations[0]
        const identifier = declaration?.id?.name

        if (!keepMetrics && /^measure/.test(identifier)) {
          console.log('removed', `const/let/var ${identifier}`)

          path.remove()
        }

        if (!keepTestFns && /^test_/.test(identifier)) {
          /**
           * We used to do it when we used babel/traverse for tests
           * Not we have custom ast traversal with visitors, but we keep this removal for now
           */
          console.log('reset', identifier, 'variable declaration to undefined')
          const initPath = path.get('declarations.0.init')

          initPath.replaceWith({ type: 'Identifier', name: 'undefined' })
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
