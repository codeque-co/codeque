import { performance } from 'perf_hooks'
import { codeFrameColumns } from '@babel/code-frame'
import { format } from 'prettier'
import { Position } from './astUtils'
import {
  optionalStringWildcardRegExp,
  requiredStringWildcardRegExp,
  disallowedWildcardRegExp
} from '/astUtils'
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
    logStepEnd
  }
}
export type Mode = 'exact' | 'include' | 'include-with-order' | 'text'

export const getMode = (mode: Mode = 'include') => {
  const modes: Mode[] = ['include', 'exact', 'include-with-order', 'text']

  if (!modes.includes(mode)) {
    console.error('Invalid mode: ', mode, '\nValid modes: ', ...modes)
    process.exit(0)
  }
  return mode
}

const metrics = {} as Record<string, number>

export const measureStart = (name: string) => {
  const timestamp = performance.now()
  return () => {
    const previousTime = metrics[name] || 0
    metrics[name] = previousTime + (performance.now() - timestamp)
  }
}

export const logMetrics = () => {
  Object.entries(metrics).forEach((kv) => print(...kv))
}

export const patternToRegex = (str: string, caseInsensitive = false) => {
  if (disallowedWildcardRegExp.test(str)) {
    throw new Error(`More than 3 wildcards chars are not allowed "${str}"`)
  }
  const strWithReplacedWildcards = str
    .replace(requiredStringWildcardRegExp, '.+?')
    .replace(optionalStringWildcardRegExp, '.*?')
  return new RegExp(
    `^${strWithReplacedWildcards}$`,
    caseInsensitive ? 'i' : undefined
  )
}

export const getCodeFrame = (
  code: string,
  startLine: number,
  formatting = false,
  errorPos?: Position
) => {
  const formatted = formatting ? format(code, { parser: 'babel-ts' }) : code

  const linesCount =
    (formatted.match(/\n/g)?.length || 0) + (!formatting ? 1 : 0)

  const maxLineLength = (startLine + linesCount).toString().length

  const indicateError = errorPos !== undefined
  const linesBelow = indicateError ? linesCount - errorPos.line : linesCount
  const linesAbove = indicateError ? errorPos.line : undefined

  const errorLocation = indicateError
    ? {
        start: errorPos,
        end: errorPos
      }
    : { start: { line: 0 } }

  let codeFrame = codeFrameColumns(formatted, errorLocation, {
    highlightCode: true,
    linesBelow,
    linesAbove
  })

  for (let i = linesCount; i > 0; i--) {
    const frameLineNum = i
    const originalPaddingLen = frameLineNum.toString().length
    codeFrame = codeFrame.replace(
      ` ${frameLineNum} |`,
      ` ${startLine + i - 1} |`.padStart(
        maxLineLength + 2 + originalPaddingLen,
        ' '
      )
    )
  }

  return codeFrame
}

export const print = console.log // to distinguish intended logs

export const asyncFilter = async <T>(
  arr: T[],
  predicate: (el: T) => Promise<boolean>
) => {
  const results = await Promise.all(arr.map(predicate))

  return arr.filter((_v, index) => results[index])
}

export const regExpTest = (regExp: RegExp, text: string) => {
  if (!text) {
    return false
  }

  const matches = text.match(regExp)

  return matches !== null && matches.length > 0
}
