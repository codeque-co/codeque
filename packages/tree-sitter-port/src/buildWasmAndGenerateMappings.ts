import { parsersSettings, inputDirPath, outputDirPath } from './settings'
import { execSync } from 'child_process'
import path from 'path'
import { logger as log } from './log'

import fs from 'fs'
import { prepareNodeTypes } from './prepareNodeTypes'

const userSelectedParsers = process.argv.slice(2)

const selectedParsers =
  userSelectedParsers.length > 0
    ? parsersSettings.filter(({ parserType, parserName }) => {
        return (
          userSelectedParsers.includes(parserType) ||
          userSelectedParsers.includes(parserName)
        )
      })
    : parsersSettings

for (const parserSettings of selectedParsers) {
  const parserLogName = `${parserSettings.parserType} (${parserSettings.parserName})`
  const localLogger = log.info('Generating for ' + parserLogName)

  try {
    const parserInputsDir = path.join(inputDirPath, parserSettings.parserName)

    const parserOutputsDir = path.join(outputDirPath, parserSettings.parserName)

    execSync(`rm -rf ${parserOutputsDir}`)

    execSync(`mkdir ${parserOutputsDir}`)

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(parserInputsDir, 'package.json')).toString(),
    )

    fs.writeFileSync(
      path.join(parserOutputsDir, 'meta.json'),
      JSON.stringify(
        {
          name: parserSettings.parserName,
          version: packageJson.version,
          generatedAt: new Date(),
        },
        null,
        2,
      ) + '\n',
    )

    execSync(`npx tree-sitter build-wasm ${parserInputsDir}`)

    const parserGeneratedFileName = `tree-sitter-${parserSettings.parserName
      .replace('tree-sitter-', '')
      .replace(/-/g, '_')}.wasm`

    execSync(
      `mv ${parserGeneratedFileName} ${path.join(
        parserOutputsDir,
        'parser.wasm',
      )}`,
    )

    localLogger.success('Wasm file generated')

    const typesGroupedByFiledType = prepareNodeTypes({
      nodeTypesToIgnore: parserSettings.nodeTypesToIgnore,
      nodeTypesFilePath: path.join(
        parserInputsDir,
        parserSettings.nodeTypesLocation,
      ),
      conflictResolvers: parserSettings.conflictResolvers,
      log: localLogger.info,
    })

    fs.writeFileSync(
      path.join(parserOutputsDir, './fields-meta.json'),
      JSON.stringify(typesGroupedByFiledType, null, 2) + '\n',
    )

    localLogger.success('fields meta file generated')
  } catch (e: unknown) {
    localLogger.error((e as Error)?.message)
  }
}

const nestedLogger = log.info('Linting files...')

execSync(`yarn lint --fix`)

nestedLogger.success('Done')
