import { ParserType } from '@codeque/core'

import path from 'path'
import { ConflictResolver } from './prepareNodeTypes'
type ParserSettings = {
  parserType: ParserType
  parserName: string
  repoUrl: string
  nodeTypesLocation: string
  buildWasmCommand: string
  nodeTypesToIgnore: string[]
  conflictResolvers?: ConflictResolver[]
}

export const inputDirPath = path.join(process.cwd(), 'input')
export const outputDirPath = path.join(process.cwd(), 'output')

const getWasmBuildCommand = (treeSitterDirName: string) =>
  `npx tree-sitter build-wasm ${path.join(inputDirPath, treeSitterDirName)}`

export const parsersSettings: ParserSettings[] = [
  {
    parserType: 'python',
    parserName: 'tree-sitter-python',
    repoUrl: 'https://github.com/tree-sitter/tree-sitter-python.git',
    nodeTypesLocation: 'src/node-types.json',
    buildWasmCommand: getWasmBuildCommand('tree-sitter-python'),
    nodeTypesToIgnore: [',', 'comment'],
    conflictResolvers: [
      {
        nodeType: 'dict_pattern',
        fields: ['key', 'children'],
        mergeToField: 'children',
      },
    ],
  },
  {
    parserType: 'babel', // temporary for test
    parserName: 'tree-sitter-c',
    repoUrl: 'https://github.com/tree-sitter/tree-sitter-c.git',
    nodeTypesLocation: 'src/node-types.json',
    buildWasmCommand: getWasmBuildCommand('tree-sitter-c'),
    nodeTypesToIgnore: [],
  },
  {
    parserType: 'csharp', // temporary for test
    parserName: 'tree-sitter-c-sharp',
    repoUrl: 'https://github.com/tree-sitter/tree-sitter-c-sharp.git',
    nodeTypesLocation: 'src/node-types.json',
    buildWasmCommand: getWasmBuildCommand('tree-sitter-c-sharp'),
    nodeTypesToIgnore: [','],
  },
  {
    parserType: 'lua', // temporary for test
    parserName: 'tree-sitter-lua',
    repoUrl: 'https://github.com/MunifTanjim/tree-sitter-lua.git',
    nodeTypesLocation: 'src/node-types.json',
    buildWasmCommand: getWasmBuildCommand('tree-sitter-lua'),
    nodeTypesToIgnore: ["'", '"'],
    conflictResolvers: [
      {
        nodeType: 'expression_list',
        fields: ['value', 'children'],
        mergeToField: 'children',
      },
    ],
  },
  {
    parserType: 'babel', // temporary for test
    parserName: 'tree-sitter-php',
    repoUrl: 'https://github.com/tree-sitter/tree-sitter-php.git',
    nodeTypesLocation: 'src/node-types.json',
    buildWasmCommand: getWasmBuildCommand('tree-sitter-php'),
    nodeTypesToIgnore: [],
  },
]
