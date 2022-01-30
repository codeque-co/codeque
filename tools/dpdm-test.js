const { parseDependencyTree } = require('dpdm');

const entryPoint = 'src/search.ts'

console.log('entryPoint', entryPoint)
// Entry point is glob, relative to cwd I suppose (absolute path does not work)
parseDependencyTree(entryPoint, {
  /* options, see below */
}).then((tree) => {
  console.log('tree', tree);
  const projectFiles = Object.keys(tree).filter((file) => !file.includes('node_modules') && /\.(ts|js|tsx|jsx|json|mjs)$/.test(file))
  console.log('projectFiles', projectFiles)
});