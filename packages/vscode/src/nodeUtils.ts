import path from 'path'
import {
  typeScriptFamilyExtensionTester,
  cssExtensionTester,
  htmlFamilyExtensionTester,
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

  return 'all'
}
