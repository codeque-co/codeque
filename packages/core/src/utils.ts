import { performance } from 'perf_hooks'
import { Logger } from './logger'

import {
  AstMatch,
  Match,
  Matches,
  MatchWithFileInfo,
  Mode,
  NodesComparator,
  NodesComparatorParameters,
} from './types'

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
  if (process.env.NODE_ENV !== 'test') {
    Object.entries(metrics).forEach((kv) => print(...kv))
  }
}

export const print = console.log // to distinguish intended logs

export const asyncFilter = async <T>(
  arr: T[],
  predicate: (el: T) => Promise<boolean>,
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
  fileContent: string,
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
    const movePrevLineEndBy =
      reverse(
        prefixContent.substring(0, positionOfPrevLineEnd - newLineCharLength),
      ).search(/\n/g) + newLineCharLength

    positionOfPrevLineEnd -= movePrevLineEndBy

    if (movePrevLineEndBy > 0) {
      moveStartLine = -1
    }

    positionOfNextLineEnd +=
      suffixContent
        .substring(positionOfNextLineEnd - end + newLineCharLength)
        .search(/\n/g) + newLineCharLength
  }

  const newCodeFrame = fileContent.substring(
    positionOfPrevLineEnd,
    positionOfNextLineEnd,
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

export function getKeyFromObject<O extends Record<string, unknown>>(
  object: O,
  key: string,
) {
  const keyParts = key.split('.')
  let val: any = object

  for (const keyPart of keyParts) {
    val = val[keyPart]
  }

  return val
}

// We process '$' (wildcards) separately
export const nonIdentifierOrKeyword = /([^\w\s$])/
export const nonIdentifierOrKeywordGlobal = new RegExp(
  nonIdentifierOrKeyword,
  'g',
)

export const dedupMatches = <M extends AstMatch>(
  matches: M[],
  log: (...args: any[]) => void,
  debug = false,
): M[] => {
  const deduped: M[] = []

  matches.forEach((match) => {
    const alreadyIn = deduped.some((_match) => {
      const filePathMatch =
        (match as MatchWithFileInfo).filePath === undefined ||
        (match as MatchWithFileInfo).filePath ===
          (_match as MatchWithFileInfo).filePath

      return (
        filePathMatch &&
        match.start === _match.start &&
        match.end === _match.end
      )
    })

    if (!alreadyIn) {
      deduped.push(match)
    }
  })

  return deduped
}

export const prepareCodeResult = ({
  fileContent,
  start,
  end,
  loc,
}: { fileContent: string } & Omit<Match, 'node'>) => {
  const frame = fileContent.substring(start - loc.start.column, end)
  const firstLineWhiteCharsCountRegExp = new RegExp(`^\\s*`)

  const firstLine = frame.split('\n')[0]
  const lines = frame.substr(loc.start.column).split('\n')
  const firstLineWhiteCharsCount = (
    firstLine?.match(firstLineWhiteCharsCountRegExp) as [string]
  )[0]?.length

  const replaceRegex = new RegExp(`^\\s{0,${firstLineWhiteCharsCount}}`)

  if (firstLineWhiteCharsCount > 0) {
    return lines.map((line) => line.replace(replaceRegex, '')).join('\n')
  }

  return lines.join('\n')
}

export const isNullOrUndef = (val: any) => val === null || val === undefined

export const SPACE_CHAR = ' '

export const normalizeText = (text: string) =>
  text ? text.trim().replace(/\s+/g, SPACE_CHAR) : text

export const runNodesComparators = (
  nodesComparators: NodesComparator[],
  nodesComparatorParams: NodesComparatorParameters,
) => {
  for (const nodesComparator of nodesComparators) {
    const compareResult = nodesComparator(...nodesComparatorParams)

    if (compareResult) {
      return compareResult
    }
  }
}

export const noopLogger: Logger = {
  log: () => undefined,
  logStepEnd: () => undefined,
  logStepStart: () => undefined,
}
