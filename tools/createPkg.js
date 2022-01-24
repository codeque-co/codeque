const fs = require('fs')

const bundleDistDir = './dist'
const pkgDir = './pkg'
const pkgDistDir = `${pkgDir}/dist`

try {
  fs.rmSync(pkgDir, { recursive: true, force: true });
}
catch (e) {

}

fs.mkdirSync(pkgDir);

fs.mkdirSync(pkgDistDir)

const pkgJSON = require('../package.json')

fs.writeFileSync(`${pkgDir}/package.json`, JSON.stringify({
  "name": pkgJSON.name,
  "version": pkgJSON.version,
  "bin": pkgJSON.bin,
  "author": pkgJSON.author,
}, undefined, 2))

const filesToSkip = [
  'crate_pkg_index_js.js',
  'dev.js',
  'getFixtures.js',
  'devGetFiles.js'
]

const JSdistFiles = fs.readdirSync('./dist').filter((fileName) => fileName.endsWith('.js') && !filesToSkip.includes(fileName))

fs.copyFileSync('./bin.js', `${pkgDir}/bin.js`)

JSdistFiles.forEach((fileName) => {
  fs.copyFileSync(`${bundleDistDir}/${fileName}`, `${pkgDistDir}/${fileName}`)
})

fs.copyFileSync(`${bundleDistDir}/index_bg.wasm`, `${pkgDistDir}/index_bg.wasm`)