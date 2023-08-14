import { parsersSettings, inputDirPath } from './settings'
import { execSync } from 'child_process'
import path from 'path'
import { logger as log } from './log'

for (const parserSettings of parsersSettings) {
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
