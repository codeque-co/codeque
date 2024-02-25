import type { Mode } from '@codeque/core'
import { SearchFileType } from './SearchStateManager'
const jsTsJson = [/^\${2,3}$/, /^\{\}$/]

const python = [/^\${2,3}$/, /^\{\}$/]

const lua = [/^\${2,3}$/, /^\{\}$/]

const text = [
  // Start with multiline query
  /^\${2,3}m/,
  // Start with any wildcard and only 3 chars in query
  /^\${2,3}m?.{0,3}$/,
  // only two chars in query
  /^..$/,
]

const html: RegExp[] = []

const css = [/^\{\}$/]

export const restrictedQueriesByFileType: Record<SearchFileType, RegExp[]> = {
  all: [...jsTsJson, ...text, ...html, ...css],
  css: css,
  'js-ts-json': jsTsJson,
  html: html,
  python: python,
  lua,
}

export const isQueryRestricted = (
  query: string,
  fileType: SearchFileType,
  mode: Mode,
) => {
  const testers = mode === 'text' ? text : restrictedQueriesByFileType[fileType]

  return testers.some((tester) => query.match(tester) !== null)
}
