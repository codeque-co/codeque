import { parsersSettings, inputDirPath } from './settings'
import { execSync } from 'child_process'
import path from 'path'
import { logger as log } from './log'

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
  const localLogger = log.info('Fetching ' + parserLogName + ' parser')
  try {
    const parserDir = path.join(inputDirPath, parserSettings.parserName)

    execSync(`rm -rf ${parserDir}`)

    execSync(
      `git clone ${parserSettings.repoUrl} ${path.join(
        inputDirPath,
        parserSettings.parserName,
      )}`,
    )

    localLogger.success('Fetched ' + parserLogName + ' parser')
  } catch (e: unknown) {
    localLogger.error((e as Error).message)
  }
}
