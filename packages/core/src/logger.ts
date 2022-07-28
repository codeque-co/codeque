import { print } from './utils'
export const createLogger = (debugMode = false) => {
  const log = (...args: any[]) => {
    if (debugMode) {
      print(...args)
    }
  }

  const logStepStart = (stepName: string) => {
    log('\n' + stepName, '\n'.padStart(10, '^'))
  }

  const logStepEnd = (stepName: string) => {
    log('\n' + stepName, '\n'.padStart(10, '&'))
  }

  return {
    log,
    logStepStart,
    logStepEnd,
  }
}

export type Logger = ReturnType<typeof createLogger>
