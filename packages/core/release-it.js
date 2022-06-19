const packageName = require('./package.json').name

module.exports = {
  hooks: {
    'before:init': ['npm run checks'],
    // Docs are generated using build CLI, so we have to build first
    'after:bump': ['npm run build']
  },
  git: {
    commitMessage: `chore: release ${packageName}@\${version}`,
    commit: true,
    tag: true,
    tagAnnotation: `${packageName}@\${version}`,
    tagName: `Release ${packageName}@\${version}`,
    push: true
  }
}
