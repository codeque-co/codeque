const fs = require('fs')

type NodeTypes = Array<{
  type: string
  named: boolean
  fields?: Record<
    string,
    {
      multiple: boolean
      required: boolean
      types: Array<{
        type: string
        named: boolean
      }>
    }
  >
  children?: {
    multiple: boolean
    required: boolean
    types: Array<{
      type: string
      named: boolean
    }>
  }

  subtypes?: Array<{
    type: string
    named: boolean
  }>
}>

type FieldsMeta = {
  type: string
  singleFieldNames: string[]
  nodeTypeToMultipleFieldName: Record<string, string>
  multipleOrChildrenFieldNames: string[]
}

export type ConflictResolver = {
  nodeType: string
  fields: [string, string]
  mergeToField: string
}

export const prepareNodeTypes = ({
  nodeTypesToIgnore,
  nodeTypesFilePath,
  conflictResolvers = [],
  log,
}: {
  nodeTypesToIgnore: string[]
  nodeTypesFilePath: string
  conflictResolvers?: Array<ConflictResolver>
  log: (msg: string) => void
}) => {
  const nodeTypes: NodeTypes = JSON.parse(
    fs.readFileSync(nodeTypesFilePath).toString(),
  )

  const types: Record<
    string,
    {
      named: boolean
      type: string
      fieldsMeta: null | Record<
        string,
        {
          multipleOrChildren: boolean
          nodeTypes: string[]
        }
      >
    }
  > = {}

  /**
   * Not named types are usually some keywords or language constants.
   * We don't care about them unless they two or more of not named types can occur in the same place in tree.
   * We capture that when processing nested node types and filter out all Not named except those relevant.
   */
  const notNamedNodeTypesToInclude: string[] = []

  const nodeTypesWithSubTypes = nodeTypes.filter(({ subtypes }) => subtypes)

  const subTypesMap = Object.fromEntries(
    nodeTypesWithSubTypes.map(({ type, subtypes }) => [
      type,
      subtypes?.map(({ type }) => type),
    ]),
  )

  /**
   * Some subtypes are nested, hence recursion
   *  */
  const extrapolateBySubtype = (nodeType: string): string[] =>
    subTypesMap[nodeType]
      ? subTypesMap[nodeType]?.map(extrapolateBySubtype)?.flat() ?? []
      : [nodeType]

  nodeTypes.forEach((nodeType) => {
    const fieldsRaw = nodeType.fields ?? {}

    if (nodeType.children) {
      fieldsRaw.children = nodeType.children
    }

    const fieldsMeta = fieldsRaw
      ? Object.fromEntries(
          Object.entries(fieldsRaw).map(([fieldName, value]) => {
            const notNamedNodeTypesInField = value.types
              .filter(({ named }) => !named)
              .map(({ type }) => type)
            notNamedNodeTypesToInclude.push(...notNamedNodeTypesInField)

            return [
              fieldName,
              {
                multipleOrChildren: value.multiple || fieldName === 'children',
                /*
                 *  Some types are just aliases for types group, eg. "expression" can be "boolean_operator" "primary_expression" and others
                 * Some subtypes are nested so we do recursion, hence we have to flat.
                 */
                nodeTypes: value.types
                  .map(({ type }) => extrapolateBySubtype(type))
                  .flat(1),
              },
            ]
          }),
        )
      : null

    if (fieldsMeta) {
      const entries = Object.entries(fieldsMeta)

      const multipleOrChildren = entries.filter(
        ([, value]) => value.multipleOrChildren,
      )
      let conflict: {
        nodeType: string
        fieldNameA: string
        fieldNameB: string
        conflictingNodeType: string
        nodeTypesFilePath: string
      } | null = null

      if (multipleOrChildren.length > 1) {
        for (let a = 0; a < multipleOrChildren.length && !conflict; a++) {
          for (let b = a + 1; b < multipleOrChildren.length && !conflict; b++) {
            const fieldNameA = multipleOrChildren[a][0]
            const fieldNameB = multipleOrChildren[b][0]

            const typesA = multipleOrChildren[a][1].nodeTypes
            const typesB = multipleOrChildren[b][1].nodeTypes

            const hasConflict = typesA.some((typeA) => typesB.includes(typeA))

            if (hasConflict) {
              let conflictingNodeType = null

              for (let i = 0; i < typesA.length && !conflictingNodeType; i++) {
                const typeAIndex = typesB.indexOf(typesA[i])

                if (typeAIndex > -1) {
                  conflictingNodeType = typesA[i]
                }
              }

              if (
                conflictingNodeType &&
                !nodeTypesToIgnore.includes(conflictingNodeType)
              ) {
                /*
                 * Conflict is when two or more fields with multiple children can have node of the same type within.
                 * In this case we won't be able to properly assign nodes by type to given named field.
                 * If conflict would occur for other parsers, we should put all node types from conflicting fields into common "children" field, as we cannot do anything better in this case.
                 *
                 * We don't care about conflicts between ignored node types, as they will not be processed anyway
                 */
                conflict = {
                  nodeType: nodeType.type,
                  fieldNameA,
                  fieldNameB,
                  conflictingNodeType,
                  nodeTypesFilePath,
                }
              }
            }
          }
        }
      }

      if (conflict !== null) {
        const conflictObj = conflict // TS is freaking out

        const conflictJsonString = JSON.stringify(conflictObj, null, 2)
        const resolver = conflictResolvers.find(({ fields, nodeType }) => {
          return (
            fields.includes(conflictObj.fieldNameA) &&
            fields.includes(conflictObj.fieldNameB) &&
            nodeType === conflictObj.nodeType
          )
        })

        if (resolver) {
          const mergeSourceFieldName = [
            conflictObj.fieldNameA,
            conflictObj.fieldNameB,
          ].filter((fieldName) => fieldName !== resolver.mergeToField)[0]

          fieldsMeta[resolver.mergeToField].nodeTypes = uniq([
            ...fieldsMeta[resolver.mergeToField].nodeTypes,
            ...fieldsMeta[mergeSourceFieldName].nodeTypes,
          ])

          delete fieldsMeta[mergeSourceFieldName]

          log('Resolved conflict ' + conflictJsonString)
        } else {
          throw new Error('Node types conflict: ' + conflictJsonString)
        }
      }
    }

    const data = {
      named: nodeType.named,
      type: nodeType.type,
      fieldsMeta,
    }

    types[nodeType.type] = data
  })

  const uniqueNotNamedNodeTypesToInclude = new Set(notNamedNodeTypesToInclude)

  const typesEntriesWithoutSomeNotNamed = Object.entries(types).filter(
    ([, { named, type }]) =>
      (named || uniqueNotNamedNodeTypesToInclude.has(type)) &&
      !subTypesMap[type],
  )

  const typesEntriesWithoutSomeNotNamedAndIgnoredTypes: typeof typesEntriesWithoutSomeNotNamed =
    typesEntriesWithoutSomeNotNamed.filter(
      ([, { named, type }]) => !nodeTypesToIgnore.includes(type),
    )

  const typesEntriesGroupedByFiledType: Array<[string, FieldsMeta]> =
    typesEntriesWithoutSomeNotNamedAndIgnoredTypes.map(
      ([nodeType, nodeData]) => {
        if (nodeData.fieldsMeta === null) {
          return [
            nodeType,
            {
              type: nodeData.type,
              singleFieldNames: [],
              nodeTypeToMultipleFieldName: {},
              multipleOrChildrenFieldNames: [],
            },
          ]
        }

        const fieldsMetaEntries = Object.entries(nodeData.fieldsMeta)
        const multipleOrChildrenFieldEntries = fieldsMetaEntries.filter(
          ([, fieldMeta]) => fieldMeta.multipleOrChildren,
        )

        const nodeTypeToMultipleFieldNameEntries =
          multipleOrChildrenFieldEntries
            .map(([fieldName, { nodeTypes }]) =>
              nodeTypes.map((nodeType) => [nodeType, fieldName]),
            )
            .flat(1)

        return [
          nodeType,
          {
            type: nodeData.type,
            singleFieldNames: fieldsMetaEntries
              .filter(([, fieldMeta]) => !fieldMeta.multipleOrChildren)
              .map(([fieldName]) => fieldName),
            nodeTypeToMultipleFieldName: Object.fromEntries(
              nodeTypeToMultipleFieldNameEntries,
            ),
            multipleOrChildrenFieldNames: multipleOrChildrenFieldEntries.map(
              ([fieldName]) => fieldName,
            ),
          },
        ]
      },
    )

  const typesGroupedByFiledType = Object.fromEntries(
    typesEntriesGroupedByFiledType,
  )

  return typesGroupedByFiledType
}

const uniq = <T>(arr: T[]) => [...new Set(arr)]
