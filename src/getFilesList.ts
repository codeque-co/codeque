import path from 'path'
import fs from 'fs';
import ignore from 'ignore';
import { measureStart } from './utils';

export const getFilesList = (root: string) => {
  const measureStop = measureStart('getFiles')
  const ignoreInstance = ignore()
  const scan = (dir: string): string[] => {
    let gitignore = ''

    try {
      gitignore = fs.readFileSync(path.join(dir, '.gitignore')).toString()
    }
    catch (e) { }

    ignoreInstance.add(gitignore)

    const entriesList = fs.readdirSync(dir, {
      // withFileTypes: true // This should work but throws an error, so we have to workaround
    }) as string[]
    const relativeToCWD = entriesList.map((entryName) => path.relative(root, path.join(dir, entryName)))
    const filtered = ignoreInstance.filter(relativeToCWD)
    const absolutePaths = filtered.map((pathName) => path.join(root, pathName))
    const directories = absolutePaths.filter((pathName) => fs.lstatSync(pathName).isDirectory())
    const files = absolutePaths.filter((pathName) => fs.lstatSync(pathName).isFile())

    const extensionTester = /\.(js|jsx|ts|tsx|json)$/

    return [
      ...files.filter((pathName) => extensionTester.test(pathName)),
      ...directories.map(scan).flat()
    ]
  }

  const filesList = scan(root)

  measureStop()

  return filesList
}
