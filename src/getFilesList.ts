import path from 'path'
import { promises as fs } from 'fs';

import ignore from 'ignore';
import { asyncFilter, measureStart } from './utils';

import { parseDependencyTree } from 'dpdm';

const getFilesListByEntryPoint = async (root: string, entryPoint: string) => {
  const tree = await parseDependencyTree(entryPoint, {
    context: root
  })

  const projectFiles = Object.keys(tree).filter((file) => !file.includes('node_modules') && /\.(ts|js|tsx|jsx|json|mjs)$/.test(file))

  return projectFiles.map((filePath) => path.resolve(root, filePath))
}

export const getFilesList = async (root: string, entryPoint?: string) => {
  const measureStop = measureStart('getFiles')

  if (entryPoint) {
    const filesList = getFilesListByEntryPoint(root, entryPoint)
    measureStop()
    return filesList
  }

  const ignoreInstance = ignore()
  const scan = async (dir: string): Promise<string[]> => {
    const dirRelativeToRoot = path.relative(root, dir)
    let gitignore = ''

    try {
      gitignore = (await fs.readFile(path.join(dir, '.gitignore'))).toString()
      const lines = gitignore.split('\n')
      const nonCommentedNonEmptyLines = lines.filter((line) => !/^(\s*)#/.test(line)).filter((line) => !/^(\s*)$/.test(line))
      const currentDirScoped = nonCommentedNonEmptyLines.map((line) => {
        return path.join(dirRelativeToRoot, line)
      })

      gitignore = currentDirScoped.join('\n')
    }
    catch (e) { }

    ignoreInstance.add(gitignore)

    const entriesList = await fs.readdir(dir, {
      // withFileTypes: true // This should work but throws an error, so we have to workaround
    }) as string[]

    const relativeToRoot = entriesList.map((entryName) => path.relative(root, path.join(dir, entryName)))
    const filtered = ignoreInstance.filter(relativeToRoot)
    const absolutePaths = filtered.map((pathName) => path.resolve(root, pathName))

    const directories = await asyncFilter(absolutePaths, async (pathName) => {
      const stat = await fs.lstat(pathName)
      return stat.isDirectory()
    })

    const files = await asyncFilter(absolutePaths, async (pathName) => {
      const stat = await fs.lstat(pathName)
      return stat.isFile()
    })

    const extensionTester = /\.(js|jsx|ts|tsx|json)$/

    const directoriesScanResult = (await Promise.all(directories.map(scan))).flat()

    return [
      ...files.filter((pathName) => extensionTester.test(pathName)),
      ...directoriesScanResult
    ]
  }

  const filesList = await scan(root)

  measureStop()

  return filesList
}
