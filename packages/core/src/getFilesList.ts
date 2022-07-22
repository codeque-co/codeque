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
    context: root
  })

  const projectFiles = Object.keys(tree).filter(
    (file) => !file.includes('node_modules') && extensionTester.test(file)
  )

  return projectFiles.map((filePath) => path.resolve(root, filePath))
}

const directoriesBlackList = ['.git']

const getFilesListByGitChanges = async (root: string) => {
  const { error, output } = spawnSync('git', ['diff', '--name-only', 'HEAD'], {
    cwd: root
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

const getGitIgnoreContentForDirectory = async (
  dirPath: string,
  searchRoot?: string
) => {
  const shouldBeRelativeToRoot = Boolean(searchRoot)

  const dirRelativeToRoot =
    shouldBeRelativeToRoot && searchRoot
      ? path.relative(searchRoot, dirPath)
      : dirPath
  let gitignore: string[] = []

  try {
    const gitignoreFileContent = (
      await fs.readFile(path.join(dirPath, '.gitignore'))
    ).toString()
    const lines = gitignoreFileContent.split('\n')
    const nonCommentedNonEmptyLines = lines
      .filter((line) => !/^(\s*)#/.test(line))
      .filter((line) => !/^(\s*)$/.test(line))

    const currentDirScoped = nonCommentedNonEmptyLines.map((line) => {
      return path.join(dirRelativeToRoot, line)
    })

    gitignore = shouldBeRelativeToRoot
      ? currentDirScoped
      : nonCommentedNonEmptyLines
  } catch (e) {
    e
  }

  return gitignore
}

export const getFilesList = async ({
  searchRoot,
  entryPoint = undefined,
  byGitChanges = false,
  omitGitIgnore = false
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

  const ignoreInstance = ignore()

  if (!omitGitIgnore) {
    const pathSeparatorChar = '/'
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
          getGitIgnoreContentForDirectory(parentPath)
        )
      )
    )
      .filter((parentGitignore) => parentGitignore.length > 0)
      .flat(1)

    ignoreInstance.add(parentDirsIgnore as string[])
  }

  const scan = async (dir: string): Promise<string[]> => {
    if (!omitGitIgnore) {
      const gitignore = await getGitIgnoreContentForDirectory(dir, undefined)

      ignoreInstance.add(gitignore as string[])
    }

    const entriesList = (await fs.readdir(dir, {
      // withFileTypes: true // This should work but throws an error, so we have to workaround
    })) as string[]

    const relativeToRoot = entriesList.map((entryName) =>
      path.relative(searchRoot, path.join(dir, entryName))
    )

    const filtered = ignoreInstance.filter(relativeToRoot)
    const absolutePaths = filtered.map((pathName) =>
      path.resolve(searchRoot, pathName)
    )

    let directories = await asyncFilter(absolutePaths, async (pathName) => {
      const stat = await fs.lstat(pathName)

      return stat.isDirectory()
    })

    directories = directories.filter((pathName) => {
      const isOnBlackList = directoriesBlackList.some((directoryName) =>
        pathName.endsWith(directoryName)
      )

      return !isOnBlackList
    })

    const files = await asyncFilter(absolutePaths, async (pathName) => {
      const stat = await fs.lstat(pathName)

      return stat.isFile()
    })

    const directoriesScanResult = (
      await Promise.all(directories.map(scan))
    ).flat()

    return [
      ...files.filter((pathName) => extensionTester.test(pathName)),
      ...directoriesScanResult
    ]
  }

  const filesList = await scan(searchRoot)
  measureStop()

  return filesList
}
