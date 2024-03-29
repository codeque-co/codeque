import { NodesComparator } from '../../types'
import { wildcardForAnyImport } from './nodeComparators/wildcardForAnyImport'
import { wildcardForAnyTypeAnnotation } from './nodeComparators/wildcardForAnyTypeAnnotation'
import { matchDestructPropBeforeRenameNodesComparator } from './nodeComparators/matchDestructPropBeforeRename'
import { matchObjectPropertiesOfDifferentTypesNodesComparator } from './nodeComparators/matchObjectPropertiesOfDifferentTypes'
import { matchJsxElementRegardlessClosingTagNodesComparator } from './nodeComparators/matchJsxElementRegardlessClosingTag'
import { matchJsxIdentifierUsingIdentifierNodesComparator } from './nodeComparators/matchJsxIdentifierUsingIdentifier'
import { partialMatchTemplateLiteralNodesComparator } from './nodeComparators/partialMatchTemplateLiteral'
import { matchOptionalFlagInMemberExpressionNodesComparator } from './nodeComparators/matchOptionalFlagInMemberExpression'
import { furtherProcessingOfTypeWildcardsInIdentifiersNodesComparator } from './nodeComparators/furtherProcessingOfTypeWildcardsInIdentifiers'

// Better keep this order
export const afterWildcardsComparators: NodesComparator[] = [
  wildcardForAnyImport,
  wildcardForAnyTypeAnnotation,
  matchDestructPropBeforeRenameNodesComparator,
  matchObjectPropertiesOfDifferentTypesNodesComparator,
  matchJsxElementRegardlessClosingTagNodesComparator,
  matchJsxIdentifierUsingIdentifierNodesComparator,
  partialMatchTemplateLiteralNodesComparator,
  matchOptionalFlagInMemberExpressionNodesComparator,
  furtherProcessingOfTypeWildcardsInIdentifiersNodesComparator, // this one seems to not have impact
]
