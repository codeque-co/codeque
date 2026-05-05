const fs = require('fs')

// will throw if not exist - that's what we want
const treeSitterWasm = fs.statSync('./dist-tree-sitter/tree-sitter.wasm')
