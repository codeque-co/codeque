import dedent from 'dedent'
import { useEffect, useState } from 'react'
import { ParserType } from '@codeque/core'
import { SearchFileType } from './types'

// eslint-disable-next-line
export function simpleDebounce<F extends (...args: any) => unknown>(func: F, timeout = 300) {
  let timer: NodeJS.Timeout

  return (...args: Parameters<F>) => {
    clearTimeout(timer)

    timer = setTimeout(() => {
      //@ts-ignore
      func.apply(this, args)
    }, timeout)
  }
}

function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce

// patch for dedent issue https://github.com/dmnd/dedent/issues/34
const newLineReplacement = 'x_-0x0-_x'
const replaceNewLine = (text: string) =>
  text.replace(/\\n/g, newLineReplacement)
const getBackNewLine = (text: string) =>
  text.replace(new RegExp(newLineReplacement, 'g'), '\\n')

export const dedentPatched = (text: string) =>
  getBackNewLine(dedent(replaceNewLine(text)))

export function getScrollParent(node: any): any {
  if (node == null || node === document) {
    return window
  }

  const overflowYStyle = window.getComputedStyle(node)['overflow-y' as any]

  if (
    node.scrollHeight > node.clientHeight &&
    (overflowYStyle === 'auto' || overflowYStyle === 'scroll')
  ) {
    return node
  } else {
    return getScrollParent(node.parentNode)
  }
}

export type SupportedParsers = Extract<
  ParserType,
  'babel' | 'angular-eslint-template-parser' | 'css-tree' | 'python' | 'lua'
>

export const supportedParsers: SupportedParsers[] = [
  'babel',
  'angular-eslint-template-parser',
  'css-tree',
  'python',
  'lua',
]

export const fileTypeToParserMap: Record<SearchFileType, SupportedParsers> = {
  all: 'babel', // it does not matter, just need value for happy TS
  html: 'angular-eslint-template-parser',
  'js-ts-json': 'babel',
  css: 'css-tree',
  python: 'python',
  lua: 'lua',
}

export const parserToFileTypeMap: Record<SupportedParsers, SearchFileType> = {
  ['angular-eslint-template-parser']: 'html',
  babel: 'js-ts-json',
  ['css-tree']: 'css',
  ['python']: 'python',
  ['lua']: 'lua',
}

const imageExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.svg',
  '.tiff',
  '.webp',
  '.exif',
  '.raw',
  '.ico',
  '.jfif',
  '.ppm',
  '.pgm',
  '.pbm',
  '.pnm',
  '.bat',
  '.bpg',
  '.rle',
  '.dds',
  '.dng',
  '.psd',
  '.psb',
  '.xcf',
]

const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot']
const archiveExtensions = [
  '.zip',
  '.rar',
  '.7z',
  '.tar',
  '.gz',
  '.bz2',
  '.xz',
  '.iso',
  '.dmg',
  '.pkg',
]

export const nonSearchableExtensions = [
  ...imageExtensions,
  ...fontExtensions,
  ...archiveExtensions,
]
