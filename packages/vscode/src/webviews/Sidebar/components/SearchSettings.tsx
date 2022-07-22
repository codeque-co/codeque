import { Flex, Radio, RadioGroup, Stack, Text } from '@chakra-ui/react'
import { Mode } from '@codeque/core'
import { useCallback, useEffect, useState } from 'react'
import { CaseType, Settings } from '../../../types'

type SearchSettingsProps = {
  initialSettings: Settings
  setSettings: (settings: Partial<Settings>) => void
}

export function SearchSettings({
  initialSettings,
  setSettings
}: SearchSettingsProps) {
  const [mode, setMode] = useState(initialSettings?.mode)
  const [caseType, setCase] = useState(initialSettings?.caseType)

  const handleModeChange = useCallback(
    (mode: Mode) => {
      setMode(mode)

      setSettings({
        mode
      })
    },
    [setSettings]
  )

  const handleCaseChange = useCallback(
    (caseType: CaseType) => {
      setCase(caseType)

      setSettings({
        caseType
      })
    },
    [setSettings]
  )

  return (
    <Flex flexDir="column">
      <Text fontWeight="medium" mb="1">
        Mode:
      </Text>
      <Flex mb="4" alignItems="center">
        <RadioGroup value={mode} onChange={handleModeChange}>
          <Stack direction="row" flexWrap="wrap">
            <Radio
              value="text"
              marginEnd="1rem !important"
              marginStart="0 !important"
            >
              text
            </Radio>
            <Radio
              value="include"
              marginStart="0 !important"
              marginEnd="1rem !important"
            >
              include
            </Radio>
            <Radio
              value="exact"
              marginStart="0 !important"
              marginEnd="1rem !important"
            >
              exact
            </Radio>
            <Radio value="include-with-order" marginStart="0 !important">
              include with order
            </Radio>
          </Stack>
        </RadioGroup>
      </Flex>
      <Text fontWeight="medium" mb="1">
        Case:
      </Text>
      <Flex alignItems="center">
        <RadioGroup value={caseType} onChange={handleCaseChange}>
          <Stack direction="row">
            <Radio value="insensitive">insensitive</Radio>
            <Radio value="sensitive" marginStart="1rem !important">
              sensitive
            </Radio>
          </Stack>
        </RadioGroup>
      </Flex>
    </Flex>
  )
}
