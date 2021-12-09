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
export type Mode = 'exact' | 'include' | 'include-with-order'

export const getMode = (mode: Mode = 'include') => {
  const modes: Mode[] = ['include', 'exact', 'include-with-order']

  if (!modes.includes(mode)) {
    console.error('Invalid mode: ', mode, '\nValid modes: ', ...modes)
    process.exit(0)
  }
  return mode
}