import path from 'path'
import {
  typeScriptFamilyExtensionTester,
  cssExtensionTester,
  htmlFamilyExtensionTester,
  pythonExtensionTester,
} from '@codeque/core'
import { SearchFileType } from './StateManager'

export const sanitizeFsPath = (fsPath: string) => {
  const isWindows = process.platform.includes('win32')

  // For some reason vscode return lowercased drive letters on windows :/
  if (isWindows && /^[a-z]:\\/.test(fsPath)) {
    const fsPathFsRoot = path.parse(fsPath).root
    const upperCasedSearchRootFsRoot = fsPathFsRoot.toUpperCase()

    return fsPath.replace(fsPathFsRoot, upperCasedSearchRootFsRoot)
  }

  return fsPath
}

export const getFileTypeFromFileExtension = (
  fileExtension: string | null,
): SearchFileType => {
  if (!fileExtension) {
    return 'all'
  }

  if (fileExtension.match(typeScriptFamilyExtensionTester) !== null) {
    return 'js-ts-json'
  }

  if (fileExtension.match(cssExtensionTester) !== null) {
    return 'css'
  }

  if (fileExtension.match(htmlFamilyExtensionTester) !== null) {
    return 'html'
  }

  if (fileExtension.match(pythonExtensionTester) !== null) {
    return 'python'
  }

  return 'all'
}

export const getMainSearchExtensionFromFilesList = (filesList: string[]) => {
  const extensionsCountMap = new Map<string, number>()

  filesList.forEach((filePath) => {
    const getExtensionRegExp = /\.(\w)+$/
    const extensions = filePath.match(getExtensionRegExp)

    if (extensions !== null) {
      const extension = extensions[0].replace('.', '')
      const currentCount = extensionsCountMap.get(extension) ?? 0
      extensionsCountMap.set(extension, currentCount + 1)
    }
  })

  const topExtension = [...extensionsCountMap].sort(
    ([, countA], [, countB]) => countB - countA,
  )[0]?.[0]

  return topExtension ?? 'unknown'
}
