import { print } from './utils'
export const createLogger = (debugMode = false) => {
  const log = (...args: any[]) => {
    if (debugMode) {
      print(...args)
    }
  }

  const logStepStart = (stepName: string) => {
    log('\n' + `${stepName}: START`, '\n')
  }

  const logStepEnd = (stepName: string) => {
    log('\n' + `${stepName}: END`, '\n')
  }

  return {
    log,
    logStepStart,
    logStepEnd,
  }
}

export type Logger = ReturnType<typeof createLogger>
