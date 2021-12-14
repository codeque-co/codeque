import { performance } from 'perf_hooks'
import { codeFrameColumns } from '@babel/code-frame'
import { format } from 'prettier'

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

export const patternToRegex = (str: string) => {
  if (/(\$){3,}/.test(str)) {
    throw new Error(`More than 2 wildcards chars are not allowed "${str}"`)
  }
  const strWithReplacedWildcards = str.replace(/\$\$/g, '.+?').replace(/\$/g, '.*?')
  return new RegExp(`^${strWithReplacedWildcards}$`)
}

export const getCodeFrame = (code: string, startLine: number, formatting = false) => {
  const formatted = formatting ? format(code, { parser: 'babel-ts' }) : code

  const linesCount = (formatted.match(/\n/g)?.length || 0) + (!formatting ? 1 : 0)

  const maxLineLength = (startLine + linesCount).toString().length

  let codeFrame = codeFrameColumns(formatted, { start: { line: 0 } }, {
    highlightCode: true,
    linesBelow: linesCount
  })

  for (let i = linesCount; i > 0; i--) {
    const frameLineNum = i
    const originalPaddingLen = (frameLineNum).toString().length
    codeFrame = codeFrame.replace(` ${frameLineNum} |`, ` ${startLine + i - 1} |`.padStart(maxLineLength + 2 + originalPaddingLen, ' '))
  }

  return codeFrame
}