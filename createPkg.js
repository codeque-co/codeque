const fs = require('fs')

const pkgDir = './pkg'
const distDir = `${pkgDir}/dist`

try {
  fs.rmSync(pkgDir, { recursive: true, force: true });
}
catch (e) {

}

fs.mkdirSync(pkgDir);

fs.mkdirSync(distDir)

const pkgJSON = require('./package.json')

fs.writeFileSync(`${pkgDir}/package.json`, JSON.stringify({
  "name": pkgJSON.name,
  "version": pkgJSON.version,
  "bin": pkgJSON.bin,
  "author": pkgJSON.author,
}, undefined, 2))

fs.copyFileSync('./bin.js', `${pkgDir}/bin.js`)
fs.copyFileSync('./dist/cli.js', `${distDir}/cli.js`)
fs.copyFileSync('./dist/worker.js', `${distDir}/worker.js`)
fs.copyFileSync('./dist/835.js', `${distDir}/835.js`)
fs.copyFileSync('./dist/index_bg.wasm', `${distDir}/index_bg.wasm`)