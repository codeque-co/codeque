const fs = require('fs')
const fsExtra = require('fs-extra')

const path = require('path')

const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm']

const getId = (counter) => {
  const len = Math.floor(counter / ids.length) + 1
  const charIdx = (counter % ids.length)
  return Array.from(Array(len)).map((_, idx) => idx).reduce((id) => {
    return id + ids[charIdx]
  }, '')
}

function main(crateBasePath) {
  const prodCratePath = crateBasePath.replace('crate', 'crate-prod')

  fsExtra.removeSync(prodCratePath)

  fsExtra.copySync(crateBasePath, prodCratePath)

  const libFilePath = path.join(prodCratePath, 'src', 'lib.rs')

  let libFileContent = fs.readFileSync(libFilePath).toString()

  const pubIds = libFileContent.match(/(?<=(pub fn )).*?(?=(\())/g)

  let idGenCounter = 0

  let replacements = {}

  pubIds.forEach((id) => {
    replacements[id] = getId(idGenCounter++)
  })

  Object.entries(replacements).forEach(([originalId, replacement]) => {
    libFileContent = libFileContent.replace(`pub fn ${originalId}`, `pub fn ${replacement}`)
  })

  fs.writeFileSync(libFilePath, libFileContent)

  return {
    prodCratePath,
    replacements
  }
}

module.exports = main