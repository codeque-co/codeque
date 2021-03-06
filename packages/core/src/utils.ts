import { performance } from 'perf_hooks'
import { codeFrameColumns } from '@babel/code-frame'
import { format } from 'prettier'
import {
  optionalStringWildcardRegExp,
  requiredStringWildcardRegExp,
  disallowedWildcardRegExp
} from './astUtils'
import { Matches, Mode, Position } from './types'

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

export const uniqueItems = <T = unknown>(...arrays: Array<T | Array<T>>) => {
  return [...new Set(arrays.flat())]
}

const reverse = (text: string) => {
  return text.split('').reverse().join('')
}

const newLineCharLength = '\n'.length

export const getExtendedCodeFrame = (
  { start, end }: { start: number; end: number },
  fileContent: string
): [string, number] => {
  const basicMatch = fileContent.substring(start, end)
  const numberOfLines = 1 + (basicMatch.match(/\n/g)?.length ?? 0)

  const suffixContent = fileContent.substring(end)
  const positionOfNextLineEndInSuffix = suffixContent.search(/\n/g)
  let positionOfNextLineEnd =
    end +
    (positionOfNextLineEndInSuffix > -1
      ? positionOfNextLineEndInSuffix
      : suffixContent.length)

  const prefixContent = fileContent.substring(0, start)
  const positionOfPrevLineEndInPrefix = reverse(prefixContent).search(/\n/g)
  let positionOfPrevLineEnd =
    start -
    (positionOfPrevLineEndInPrefix > -1
      ? positionOfPrevLineEndInPrefix
      : prefixContent.length)

  let moveStartLine = 0

  if (numberOfLines < 3) {
    moveStartLine = -1

    positionOfPrevLineEnd -=
      reverse(
        prefixContent.substring(0, positionOfPrevLineEnd - newLineCharLength)
      ).search(/\n/g) + newLineCharLength

    positionOfNextLineEnd +=
      suffixContent
        .substring(positionOfNextLineEnd - end + newLineCharLength)
        .search(/\n/g) + newLineCharLength
  }

  const newCodeFrame = fileContent.substring(
    positionOfPrevLineEnd,
    positionOfNextLineEnd
  )

  return [newCodeFrame, moveStartLine]
}

export const groupMatchesByFile = (matches: Matches) => {
  return matches.reduce((grouped, match) => {
    if (grouped[match.filePath] === undefined) {
      grouped[match.filePath] = []
    }
    grouped[match.filePath].push(match)
    return grouped
  }, {} as Record<string, Matches>)
}
