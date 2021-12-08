import path from 'path'
import fs from 'fs';
import ignore from 'ignore';

export const getFilesList = (root: string) => {
  let gitignore = ''
  try {
    gitignore = fs.readFileSync(path.join(root, '.gitignore')).toString()
  }
  catch (e) {
    console.log('gitignore not found')
  }
  const ignoreInstance = ignore().add(gitignore)
  const scan = (dir: string): string[] => {
    const entriesList = fs.readdirSync(dir, {
      // withFileTypes: true // This should work but throws an error, so we have to workaround
    }) as string[]
    const relativeToCWD = entriesList.map((entryName) => path.relative(root, path.join(dir, entryName)))
    const filtered = ignoreInstance.filter(relativeToCWD)
    const absolutePaths = filtered.map((pathName) => path.join(root, pathName))
    const directories = absolutePaths.filter((pathName) => fs.lstatSync(pathName).isDirectory())
    const files = absolutePaths.filter((pathName) => fs.lstatSync(pathName).isFile())

    const extensionTester = /\.(js|jsx|ts|tsx)$/

    return [
      ...files.filter((pathName) => extensionTester.test(pathName)),
      ...directories.map(scan).flat()
    ]
  }

  const filesList = scan(root)
  return filesList
}
