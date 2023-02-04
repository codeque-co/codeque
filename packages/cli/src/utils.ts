import { Hint, Position } from '@codeque/core'
import path from 'path'
import { codeFrameColumns } from '@babel/code-frame'
import { format } from 'prettier'

export const textEllipsis = (text: string, maxLength: number) => {
  const charsToReplace = Math.max(text.length - maxLength, 0)
  const ellipsis = '...'
  const shortenedRoot =
    charsToReplace > 0
      ? text.replace(
          new RegExp(`^(.){${charsToReplace + ellipsis.length}}`),
          ellipsis,
        )
      : text

  return shortenedRoot
}

export const prepareHintText = (hint: Hint) => {
  return hint.tokens
    .map(({ content, type }) => (type === 'code' ? `\`${content}\`` : content))
    .join(' ')
}

export const print = console.log

export const printVersionNumber = () => {
  const versionNumber = require(path.join(__dirname, '../package.json')).version

  print()
  print(versionNumber)
  print()
}

export const getCodeFrame = (
  code: string,
  startLine: number,
  formatting = false,
  errorPos?: Position,
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
        end: errorPos,
      }
    : { start: { line: 0 } }

  let codeFrame = codeFrameColumns(formatted, errorLocation, {
    highlightCode: true,
    linesBelow,
    linesAbove,
  })

  for (let i = linesCount; i > 0; i--) {
    const frameLineNum = i
    const originalPaddingLen = frameLineNum.toString().length

    codeFrame = codeFrame.replace(
      ` ${frameLineNum} |`,
      ` ${startLine + i - 1} |`.padStart(
        maxLineLength + 2 + originalPaddingLen,
        ' ',
      ),
    )
  }

  return codeFrame
}
