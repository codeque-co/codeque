import { Mode, ParserSettings, PoorNodeType } from './types'

export type IdentifierWildcardAlias = {
  alias: string
  aliasValue: string
  wildcard: string
}

export type StringWildcardAlias = {
  alias: string
  aliasValue: string
  wildcard: string
}

export type NodesTreeWildcardAlias = {
  alias: string
  aliasNode: PoorNodeType
  aliasValue: string
  wildcard: string
}

type IdentifierWildcardAliasesMap = Record<
  IdentifierWildcardAlias['alias'],
  IdentifierWildcardAlias
>

type StringWildcardAliasesMap = Record<
  StringWildcardAlias['alias'],
  StringWildcardAlias
>

type NodesTreeWildcardAliasesMap = Record<
  NodesTreeWildcardAlias['alias'],
  NodesTreeWildcardAlias
>

export type MatchContextAliases = {
  identifierAliasesMap: IdentifierWildcardAliasesMap
  stringAliasesMap: StringWildcardAliasesMap
  nodesTreeAliasesMap: NodesTreeWildcardAliasesMap
}

export type MatchContext = {
  addIdentifierAlias: (ref: IdentifierWildcardAlias) => void
  getIdentifierAlias: (alias: string) => IdentifierWildcardAlias | null
  addStringAlias: (ref: StringWildcardAlias) => void
  getStringAlias: (alias: string) => StringWildcardAlias | null
  addNodesTreeAlias: (ref: NodesTreeWildcardAlias) => void
  getNodesTreeAlias: (alias: string) => NodesTreeWildcardAlias | null
  getAllAliases: () => MatchContextAliases
  merge: (contextMatchAliases: MatchContextAliases) => void
}

export const createMatchContext = (
  initialContext?: MatchContextAliases,
): MatchContext => {
  let identifierAliasesMap: IdentifierWildcardAliasesMap = initialContext
    ? { ...(initialContext.identifierAliasesMap ?? {}) }
    : {}
  const addIdentifierAlias = (wildcardAlias: IdentifierWildcardAlias) => {
    identifierAliasesMap[wildcardAlias.alias] = wildcardAlias
  }

  const getIdentifierAlias = (alias: string) => {
    return identifierAliasesMap[alias] ?? null
  }

  let stringAliasesMap: StringWildcardAliasesMap = initialContext
    ? { ...(initialContext.stringAliasesMap ?? {}) }
    : {}
  const addStringAlias = (wildcardAlias: StringWildcardAlias) => {
    stringAliasesMap[wildcardAlias.alias] = wildcardAlias
  }

  const getStringAlias = (alias: string) => {
    return stringAliasesMap[alias] ?? null
  }

  let nodesTreeAliasesMap: NodesTreeWildcardAliasesMap = initialContext
    ? { ...(initialContext.nodesTreeAliasesMap ?? {}) }
    : {}

  const addNodesTreeAlias = (wildcardAlias: NodesTreeWildcardAlias) => {
    nodesTreeAliasesMap[wildcardAlias.alias] = wildcardAlias
  }

  const getNodesTreeAlias = (alias: string) => {
    return nodesTreeAliasesMap[alias] ?? null
  }

  const merge = (aliasesToMerge: MatchContextAliases) => {
    identifierAliasesMap = {
      ...identifierAliasesMap,
      ...aliasesToMerge.identifierAliasesMap,
    }

    stringAliasesMap = {
      ...stringAliasesMap,
      ...aliasesToMerge.stringAliasesMap,
    }

    nodesTreeAliasesMap = {
      ...nodesTreeAliasesMap,
      ...aliasesToMerge.nodesTreeAliasesMap,
    }
  }

  return {
    addIdentifierAlias,
    getIdentifierAlias,
    addStringAlias,
    getStringAlias,
    addNodesTreeAlias,
    getNodesTreeAlias,
    getAllAliases: () => ({
      identifierAliasesMap,
      stringAliasesMap,
      nodesTreeAliasesMap,
    }),
    merge,
  }
}
