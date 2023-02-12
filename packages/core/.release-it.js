const packageName = require('./package.json').name

module.exports = {
  hooks: {
    'before:init': ['npm run build:test', 'npm run checks'],
    // Docs are generated using build CLI, so we have to build first
    'after:bump': ['npm run build']
  },
  git: {
    commitMessage: `chore: release ${packageName}@\${version}`,
    commit: true,
    tag: true,
    tagAnnotation: `Release ${packageName}@\${version}`,
    tagName: `${packageName}@\${version}`,
    push: true
  }
}
