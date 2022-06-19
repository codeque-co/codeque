import mockFs from 'mock-fs'
import { getFilesList } from '/getFilesList'
import dedent from 'dedent'

afterEach(() => {
  mockFs.restore()
})

const cwd = process.cwd()
const removeCwd = (filePaths: string[]) =>
  filePaths.map((filePath) => filePath.replace(cwd, ''))

it('should return files list without gitignore', async () => {
  mockFs({
    '/root': {
      project: {
        'fileA.ts': 'content',
        'fileB.js': 'content',
        'fileC.txt': 'content',
        src: {
          'fileC.tsx': '',
          'fileD.jsx': '',
          config: {
            'fileE.json': ''
          }
        }
      }
    }
  })

  const filesList = removeCwd(
    await getFilesList({ searchRoot: '/root/project' })
  )
  mockFs.restore()

  expect(filesList).toMatchObject([
    '/root/project/fileA.ts',
    '/root/project/fileB.js',
    '/root/project/src/fileC.tsx',
    '/root/project/src/fileD.jsx',
    '/root/project/src/config/fileE.json'
  ])
})

it('should return files for project root with gitignore', async () => {
  mockFs({
    '/root': {
      project: {
        'fileA.ts': 'content',
        'fileB.js': 'content',
        'fileC.txt': 'content',
        '.gitignore': '**/config/fileE.json',
        src: {
          'fileC.tsx': '',
          'fileD.jsx': '',
          config: {
            'fileE.json': ''
          }
        }
      }
    }
  })

  const filesList = removeCwd(
    await getFilesList({ searchRoot: '/root/project' })
  )
  mockFs.restore()

  expect(filesList).toMatchObject([
    '/root/project/fileA.ts',
    '/root/project/fileB.js',
    '/root/project/src/fileC.tsx',
    '/root/project/src/fileD.jsx'
  ])
})

it('should return files for project root with two gitignores', async () => {
  mockFs({
    '/root': {
      project: {
        'fileA.ts': 'content',
        'fileB.js': 'content',
        'fileC.txt': 'content',
        '.gitignore': 'fileC.*',
        src: {
          'fileC.tsx': '',
          'fileD.jsx': '',
          '.gitignore': '*.json',
          config: {
            'fileE.json': ''
          }
        }
      }
    }
  })

  const filesList = removeCwd(
    await getFilesList({ searchRoot: '/root/project' })
  )
  mockFs.restore()

  expect(filesList).toMatchObject([
    '/root/project/fileA.ts',
    '/root/project/fileB.js',
    '/root/project/src/fileD.jsx'
  ])
})

it('should return files for project root with omitting gitignore', async () => {
  mockFs({
    '/root': {
      project: {
        'fileA.ts': 'content',
        'fileB.js': 'content',
        'fileC.txt': 'content',
        '.gitignore': '**/config/fileE.json',
        src: {
          'fileC.tsx': '',
          'fileD.jsx': '',
          config: {
            'fileE.json': ''
          }
        }
      }
    }
  })

  const filesList = removeCwd(
    await getFilesList({ searchRoot: '/root/project', omitGitIgnore: true })
  )
  mockFs.restore()

  expect(filesList).toMatchObject([
    '/root/project/fileA.ts',
    '/root/project/fileB.js',
    '/root/project/src/fileC.tsx',
    '/root/project/src/fileD.jsx',
    '/root/project/src/config/fileE.json'
  ])
})

it('should return files for project root ignored by parent gitignore, but ignore the nested directories', async () => {
  mockFs({
    '/root': {
      project: {
        'fileA.ts': 'content',
        'fileB.js': 'content',
        'fileC.txt': 'content',
        '.gitignore': dedent`
          **/config/*.json
          **/config/*.js
        `,
        src: {
          'fileC.tsx': '',
          'fileD.jsx': '',
          config: {
            'fileE.json': '',
            dir: {
              config: {
                'fileF.js': '',
                'fileG.ts': ''
              }
            }
          }
        }
      }
    }
  })

  const filesList = removeCwd(
    await getFilesList({ searchRoot: '/root/project/src/config' })
  )

  mockFs.restore()

  expect(filesList).toMatchObject([
    '/root/project/src/config/fileE.json',
    '/root/project/src/config/dir/config/fileG.ts'
  ])
})

it('should ignore files from parent .gitignore', async () => {
  mockFs({
    '/root': {
      project: {
        'fileA.ts': 'content',
        'fileB.js': 'content',
        'fileC.txt': 'content',
        '.gitignore': dedent`
          **/config/*.json
          **/config/*.js
        `,
        src: {
          'fileC.tsx': '',
          'fileD.jsx': '',
          config: {
            'fileE.json': '',
            dir: {
              config: {
                'fileF.js': '',
                'fileG.ts': ''
              }
            }
          }
        }
      }
    }
  })

  const filesList = removeCwd(
    await getFilesList({ searchRoot: '/root/project/src' })
  )

  mockFs.restore()

  expect(filesList).toMatchObject([
    '/root/project/src/fileC.tsx',
    '/root/project/src/fileD.jsx',
    '/root/project/src/config/dir/config/fileG.ts'
  ])
})
