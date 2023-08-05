import path from 'path'
import { promises as fs } from 'fs'

import ignore from 'ignore'
import { asyncFilter, measureStart } from './utils'
import minimatch from 'minimatch'
import { parseDependencyTree } from 'dpdm/lib/index.js'
import { spawnSync } from 'child_process'

//@ts-ignore
import escapeGlob from 'glob-escape'
import { HardStopFlag } from './types'

export const typeScriptFamilyExtensionTester = /\.(js|jsx|ts|tsx|json|mjs|cjs)$/
export const htmlFamilyExtensionTester = /\.(html|htm)$/
export const cssExtensionTester = /\.(css)$/

/**
 * @deprecated use `typeScriptFamilyExtensionTester` instead
 */
export const extensionTester = typeScriptFamilyExtensionTester

export const pathToPosix = (fsPath: string) => fsPath.replace(/\\/g, '/')

const bigFileSizeInBytes = 1024 * 100 // 100 kb

const getFilesListByEntryPoint = async (root: string, entryPoint: string) => {
  // dpdm does not support custom search directory :/
  const oldProcessCwd = process.cwd
  process.cwd = () => root

  const tree = await parseDependencyTree(escapeGlob(entryPoint), {
    context: root,
  })

  process.cwd = oldProcessCwd

  const projectFiles = Object.keys(tree).filter(
    (file) =>
      !file.includes('node_modules') &&
      typeScriptFamilyExtensionTester.test(file),
  )

  return projectFiles.map((filePath) => path.resolve(root, filePath))
}

const directoriesBlackList = ['.git']

const getFilesListByGitChanges = async (
  root: string,
  extensionTester: RegExp,
) => {
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

export const pathSeparatorChar = path.sep
export const getFsRoot = (fsPath: string) => path.parse(fsPath).root

const getGitIgnoreContentForDirectory = async (dirPath: string) => {
  const fsRoot = getFsRoot(dirPath)
  const gitignorePathSeparator = '/'
  let gitignore: string[] = []
  try {
    const gitignorePath = path.join(dirPath, '.gitignore')

    const gitignoreFileContent = (await fs.readFile(gitignorePath)).toString()
    const lines = gitignoreFileContent.split('\n').map((line) => line.trim())
    const nonCommentedNonEmptyLines = lines
      .filter((line) => !/^(\s*)#/.test(line))
      .filter((line) => !/^(\s*)$/.test(line))

    const maybeRelativeToDir = nonCommentedNonEmptyLines.map((line) => {
      if (
        // Pattern starts with dir separator eg. /some
        line.startsWith(gitignorePathSeparator) ||
        // Pattern contains dir separator as not last char and is not path beginning wildcard eg. some/path, but not **/some/path
        (!line.startsWith(`**${gitignorePathSeparator}`) &&
          line.substring(0, line.length - 1).includes(gitignorePathSeparator))
      ) {
        // pattern should be relative to .gitignore location directory
        // `ignore` does not allow absolute paths, so we have to hack by removing initial '/' or 'C:\'
        const fsPosixPathWithoutRoot = pathToPosix(dirPath.replace(fsRoot, ''))

        const composedPath = `${fsPosixPathWithoutRoot}${gitignorePathSeparator}${line}`

        // We normalize cos path can end with `/` so there would be '//'
        // Also we change path to Posix, because path.normalise change it to format depending on platform
        return pathToPosix(path.normalize(composedPath))
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

const removeInitialDot = (p: string) => p.replace(/^\.(\\|\/)/, '')

export const filterIncludeExclude = ({
  searchRoot,
  include: _include,
  exclude: _exclude,
  filesList,
}: {
  searchRoot: string
  exclude: string[]
  include: string[] | undefined
  filesList: string[]
}) => {
  const include = _include ? _include.map(removeInitialDot) : _include
  const exclude = _exclude.map(removeInitialDot)

  if (!include && exclude.length === 0) {
    return filesList
  }

  return filesList
    .map((p) => path.relative(searchRoot, p))
    .filter((id) =>
      exclude.reduce(
        (result, pattern) => result && !minimatch(id, pattern),
        true as boolean,
      ),
    )
    .filter((id) =>
      include
        ? include.reduce(
            (result, pattern) => result || minimatch(id, pattern),
            false as boolean,
          )
        : true,
    )
    .map((p) => path.join(searchRoot, p))
}

export const filterExtensions = (
  filesList: string[],
  extensionTester: RegExp,
) => {
  return filesList.filter((filePath) => extensionTester.test(filePath))
}

export type GetFilesListArgs = {
  searchRoot: string
  entryPoint?: string
  byGitChanges?: boolean
  omitGitIgnore?: boolean
  ignoreNodeModules?: boolean
  searchBigFiles?: boolean
  exclude?: string[]
  include?: string[]
  hardStopFlag?: HardStopFlag
  extensionTester?: RegExp
}

export const getFilesList = async ({
  searchRoot: _searchRoot,
  entryPoint = undefined,
  byGitChanges = false,
  omitGitIgnore = false,
  ignoreNodeModules = true,
  searchBigFiles = false,
  exclude = [],
  include = undefined,
  hardStopFlag,
  extensionTester = typeScriptFamilyExtensionTester,
}: GetFilesListArgs) => {
  const searchRoot = path.normalize(_searchRoot)
  const fsRoot = getFsRoot(searchRoot)

  const measureStop = measureStart('getFiles')
  let filesList: string[] = []

  if (byGitChanges) {
    filesList = await getFilesListByGitChanges(searchRoot, extensionTester)
  } else if (entryPoint) {
    filesList = await getFilesListByEntryPoint(searchRoot, entryPoint)
  } else {
    const InitialIgnore = ignoreNodeModules ? ['node_modules'] : []

    // Get parent to root gitignore
    if (!omitGitIgnore) {
      const searchRootSegments = searchRoot
        .replace(fsRoot, '')
        .split(pathSeparatorChar)

      const pathSegmentsToSystemRoot = []

      for (let i = 0; i < searchRootSegments.length; i++) {
        let currentPath = searchRootSegments.slice(0, i).join(pathSeparatorChar)

        currentPath = fsRoot + currentPath

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

      InitialIgnore.push(...parentDirsIgnore)
    }

    const scan = async (
      dir: string,
      parentIgnore: string[],
    ): Promise<string[]> => {
      if (hardStopFlag?.stopSearch) {
        return []
      }

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
        // remove initial '/' or 'C:\' as ignore instance is not allowing for absolute paths
        .filter(absolutePaths.map((p) => p.replace(fsRoot, '')))
        // add initial '/' or 'C:\' back
        .map((p) => `${fsRoot}${p}`)

      const absolutePathsWithStats = await Promise.all(
        filteredAbsolutePaths.map(async (absolutePath) => {
          try {
            let resolvedPath = absolutePath
            let stat = await fs.lstat(absolutePath)

            if (stat.isSymbolicLink()) {
              resolvedPath = await fs.realpath(absolutePath)
              stat = await fs.stat(resolvedPath)
            }

            return {
              absolutePath,
              size: stat.size,
              isFile: stat.isFile(),
              isDirectory: stat.isDirectory(),
            }
          } catch (e) {
            return {
              absolutePath,
              size: -1,
              isFile: false,
              isDirectory: false,
            }
          }
        }),
      )

      let directories = absolutePathsWithStats
        .filter(({ isDirectory }) => isDirectory)
        .map(({ absolutePath }) => absolutePath)

      directories = directories.filter((pathName) => {
        const isOnBlackList = directoriesBlackList.some((directoryName) =>
          pathName.endsWith(directoryName),
        )

        return !isOnBlackList
      })

      const files = absolutePathsWithStats
        .filter(
          ({ isFile, size }) =>
            (isFile && size < bigFileSizeInBytes) || searchBigFiles,
        )
        .map(({ absolutePath }) => absolutePath)

      const directoriesScanResult = (
        await Promise.all(directories.map((dir) => scan(dir, localIgnore)))
      ).flat()

      return [
        ...files.filter((pathName) => extensionTester.test(pathName)),
        ...directoriesScanResult,
      ]
    }

    filesList = await scan(searchRoot, InitialIgnore)
  }

  const filteredExcludeInclude = filterIncludeExclude({
    filesList,
    searchRoot,
    exclude,
    include,
  })

  measureStop()

  return filteredExcludeInclude
}
