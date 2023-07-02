import { NodesComparator } from '../../types'
import { createMatchWildcardsInPropValueNodesComparator } from '../nodeComparatorFactories/Other/matchWildcardsInPropValueNodes'
import { matchWildcardInDeclarationProperty } from './matchWildcardInDeclarationProperty'
import { matchWildcardsInDimension } from './matchWildcardsInDimension'
import { matchHashWithWildcard } from './matchHashWithWildcard'

const nodeTypesWithNameAndChildren = ['Function']

const matchWildcardsInNodeTypesWithNameAndChildrenNodesComparator =
  nodeTypesWithNameAndChildren.map((nodeType) =>
    createMatchWildcardsInPropValueNodesComparator({
      nodeType,
      keysToTraverse: ['children'],
      keysWithWildcards: ['name'],
    }),
  )

const nodeTypesWithNameAndValue = ['MediaFeature']

const matchWildcardsInNodeTypesWithNameAndValueNodesComparator =
  nodeTypesWithNameAndValue.map((nodeType) =>
    createMatchWildcardsInPropValueNodesComparator({
      nodeType,
      keysToTraverse: ['value'],
      keysWithWildcards: ['name'],
    }),
  )

export const beforeWildcardsComparators: NodesComparator[] = [
  ...matchWildcardsInNodeTypesWithNameAndChildrenNodesComparator,
  ...matchWildcardsInNodeTypesWithNameAndValueNodesComparator,
  matchWildcardInDeclarationProperty,
  matchWildcardsInDimension,
  matchHashWithWildcard,
]
