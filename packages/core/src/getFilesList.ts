import path from 'path'
import { promises as fs } from 'fs'

import ignore from 'ignore'
import { asyncFilter, measureStart } from './utils'

import { parseDependencyTree } from 'dpdm/lib/index.js'
import { spawnSync } from 'child_process'

//@ts-ignore
import escapeGlob from 'glob-escape'

const extensionTester = /\.(js|jsx|ts|tsx|json|mjs)$/

const getFilesListByEntryPoint = async (root: string, entryPoint: string) => {
  const tree = await parseDependencyTree(escapeGlob(entryPoint), {
    context: root,
  })

  const projectFiles = Object.keys(tree).filter(
    (file) => !file.includes('node_modules') && extensionTester.test(file),
  )

  return projectFiles.map((filePath) => path.resolve(root, filePath))
}

const directoriesBlackList = ['.git']

const getFilesListByGitChanges = async (root: string) => {
  const { error, output } = spawnSync('git', ['diff', '--name-only', 'HEAD'], {
    cwd: root,
  })

  if (error) {
    throw error
  }

  const filesList = output
    .filter((data) => data !== null)
    .map((buff) => buff?.toString())
    .join('')
    .split('\n')
    .filter((maybeFile) => maybeFile.length > 0)
    .filter((filePath) => extensionTester.test(filePath))
    .map((filePath) => path.resolve(root, filePath))

  return filesList
}

const pathSeparatorChar = '/'

const getGitIgnoreContentForDirectory = async (dirPath: string) => {
  let gitignore: string[] = []

  try {
    const gitignoreFileContent = (
      await fs.readFile(path.join(dirPath, '.gitignore'))
    ).toString()
    const lines = gitignoreFileContent.split('\n').map((line) => line.trim())
    const nonCommentedNonEmptyLines = lines
      .filter((line) => !/^(\s*)#/.test(line))
      .filter((line) => !/^(\s*)$/.test(line))

    const maybeRelativeToDir = nonCommentedNonEmptyLines.map((line) => {
      if (
        // Pattern starts with dir separator eg. /some
        line.startsWith(pathSeparatorChar) ||
        // Pattern contains dir separator as not last char and is not path beginning wildcard eg. some/path, but not **/some/path
        (!line.startsWith('**/') &&
          line.substring(0, line.length - 1).includes(pathSeparatorChar))
      ) {
        // pattern should be relative to .gitignore location directory
        // `ignore` does not allow absolute paths, so we have to hack by removing initial '/'
        return path.join(dirPath, line).substring(1)
      }

      // pattern should not be relative to .gitignore location directory, eg. '*.json', '**/someFile', 'dist/'
      return line
    })

    gitignore = maybeRelativeToDir
  } catch (e) {
    e
  }

  return gitignore
}

export const getFilesList = async ({
  searchRoot,
  entryPoint = undefined,
  byGitChanges = false,
  omitGitIgnore = false,
}: {
  searchRoot: string
  entryPoint?: string
  byGitChanges?: boolean
  omitGitIgnore?: boolean
}) => {
  const measureStop = measureStart('getFiles')

  if (byGitChanges) {
    const filesList = getFilesListByGitChanges(searchRoot)
    measureStop()

    return filesList
  }

  if (entryPoint) {
    const filesList = getFilesListByEntryPoint(searchRoot, entryPoint)
    measureStop()

    return filesList
  }

  const parentToRootIgnore = []

  if (!omitGitIgnore) {
    const searchRootSegments = searchRoot.split(pathSeparatorChar)

    const pathSegmentsToSystemRoot = []

    for (let i = 1; i < searchRootSegments.length; i++) {
      let currentPath = searchRootSegments.slice(0, i).join(pathSeparatorChar)

      if (!currentPath.startsWith(pathSeparatorChar)) {
        currentPath = pathSeparatorChar + currentPath
      }

      pathSegmentsToSystemRoot.push(currentPath)
    }

    const parentDirsIgnore = (
      await Promise.all(
        pathSegmentsToSystemRoot.map((parentPath) =>
          getGitIgnoreContentForDirectory(parentPath),
        ),
      )
    )
      .filter((parentGitignore) => parentGitignore.length > 0)
      .flat(1)

    parentToRootIgnore.push(...parentDirsIgnore)
  }

  const scan = async (
    dir: string,
    parentIgnore: string[],
  ): Promise<string[]> => {
    const localIgnore = [...parentIgnore]

    if (!omitGitIgnore) {
      const gitignore = await getGitIgnoreContentForDirectory(dir)

      localIgnore.push(...gitignore)
    }

    const ignoreInstance = ignore()
    ignoreInstance.add(localIgnore)

    const entriesList = (await fs.readdir(dir, {
      // withFileTypes: true // This should work but throws an error, so we have to workaround
    })) as string[]

    const absolutePaths = entriesList.map((entry) => path.join(dir, entry))

    const filteredAbsolutePaths = ignoreInstance
      // remove initial '/' as ignore instance is not allowing for absolute paths
      .filter(absolutePaths.map((p) => p.substring(1)))
      // add initial '/' back
      .map((p) => `/${p}`)

    let directories = await asyncFilter(
      filteredAbsolutePaths,
      async (pathName) => {
        const stat = await fs.lstat(pathName)

        return stat.isDirectory()
      },
    )

    directories = directories.filter((pathName) => {
      const isOnBlackList = directoriesBlackList.some((directoryName) =>
        pathName.endsWith(directoryName),
      )

      return !isOnBlackList
    })

    const files = await asyncFilter(filteredAbsolutePaths, async (pathName) => {
      const stat = await fs.lstat(pathName)

      return stat.isFile()
    })

    const directoriesScanResult = (
      await Promise.all(directories.map((dir) => scan(dir, localIgnore)))
    ).flat()

    return [
      ...files.filter((pathName) => extensionTester.test(pathName)),
      ...directoriesScanResult,
    ]
  }

  const filesList = await scan(searchRoot, parentToRootIgnore)
  measureStop()

  return filesList
}
