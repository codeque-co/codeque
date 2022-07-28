import { Hint } from '@codeque/core'
import path from 'path'

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
