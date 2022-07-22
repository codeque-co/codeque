const fs = require('fs')
const path = require('path')

const pkgPath = path.join(
  __dirname,
  'node_modules',
  'framer-motion',
  'package.json'
)
const framerMotionPkg = JSON.parse(fs.readFileSync(pkgPath).toString())

// delete module and exports to force cjs to fix webpack issue with process/browser :/
delete framerMotionPkg.module
delete framerMotionPkg.exports

fs.writeFileSync(pkgPath, JSON.stringify(framerMotionPkg, null, 2))
