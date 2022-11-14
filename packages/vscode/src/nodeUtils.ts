import path from 'path'
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
