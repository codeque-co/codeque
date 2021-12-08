export const createLogger = (debugMode = false) => {

  const log = (...args: any[]) => {
    if (debugMode) {
      console.log(...args)
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
    logStepEnd
  }
}