import { parsersSettings, inputDirPath, outputDirPath } from './settings'
import { execSync } from 'child_process'
import path from 'path'
import { logger as log } from './log'
import { ParserType } from '@codeque/core'

const parsersToCopy: Array<ParserType> = ['python', 'lua']

const filteredParserSettings = parsersSettings.filter(({ parserType }) =>
  parsersToCopy.includes(parserType),
)

execSync(`rm -rf ../core/dist-tree-sitter`)
execSync(`rm -rf ../vscode/dist-tree-sitter`)

execSync(`mkdir ../core/dist-tree-sitter`)
execSync(`mkdir ../vscode/dist-tree-sitter`)

execSync(
  `cp ../../node_modules/web-tree-sitter/tree-sitter.wasm ../core/dist-tree-sitter/tree-sitter.wasm`,
)

execSync(
  `cp ../../node_modules/web-tree-sitter/tree-sitter.wasm ../vscode/dist-tree-sitter/tree-sitter.wasm`,
)

log.success('Prepared directories and copied tree-sitter.wasm')

for (const parserSettings of filteredParserSettings) {
  const parserLogName = `${parserSettings.parserType} (${parserSettings.parserName})`
  const localLogger = log.info('Copying ' + parserLogName + ' parser')
  const outputDir = path.join(outputDirPath, parserSettings.parserName)

  const coreDirName = path.join(
    process.cwd(),
    '../core/dist-tree-sitter',
    parserSettings.parserName,
  )
  const vscodeDirName = path.join(
    process.cwd(),
    '../vscode/dist-tree-sitter',
    parserSettings.parserName,
  )

  try {
    execSync(`cp -r ${outputDir} ${coreDirName}`)

    execSync(`cp -r ${outputDir} ${vscodeDirName}`)

    localLogger.success('Copied ' + parserLogName + ' parser')
  } catch (e: unknown) {
    localLogger.error((e as Error).message)
  }
}
