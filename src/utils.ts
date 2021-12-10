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

let metrics = {} as Record<string, number>

export const measureStart = (name: string) => {
  const timestamp = performance.now()
  return () => {
    const previousTime = metrics[name] || 0
    metrics[name] = previousTime + (performance.now() - timestamp)
  }
}

export const logMetrics = () => {
  Object.entries(metrics).forEach((kv) => console.log(...kv))
}