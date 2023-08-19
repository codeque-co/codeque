import { SearchFileType } from './StateManager'
const jsTsJson = [/^\${2,3}$/, /^\{\}$/]

const python = [/^\${2,3}$/, /^\{\}$/]

const lua = [/^\${2,3}$/, /^\{\}$/]

const text = [/^\${2,3}m?.{0,3}$/, /^..$/]

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

export const isQueryRestricted = (query: string, fileType: SearchFileType) => {
  return restrictedQueriesByFileType[fileType].some(
    (tester) => query.match(tester) !== null,
  )
}
