import { Button, Flex, Radio, RadioGroup, Stack, Text } from '@chakra-ui/react'
import { Mode } from '@codeque/core'
import { useCallback, useEffect, useState } from 'react'
import { CaseType, Settings } from '../../../types'
import { eventBusInstance } from '../../../EventBus'

type SearchSettingsProps = {
  initialSettings: Settings
  setSettings: (settings: Partial<Settings>) => void
  resultsPanelVisible: boolean
}

export function SearchSettings({
  initialSettings,
  setSettings,
  resultsPanelVisible
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

  const showResultsPanel = () => {
    eventBusInstance.dispatch('show-results-panel')
  }

  return (
    <Flex flexDir="column" height="98vh">
      {!resultsPanelVisible && (
        <Flex
          position="absolute"
          top="0"
          bottom="0"
          left="0"
          right="0"
          backgroundColor="rgba(0,0,0,0.2)"
          zIndex="10"
          justifyContent="center"
          alignItems="center"
          onClick={showResultsPanel}
          cursor="pointer"
          backdropFilter="blur(2px)"
        >
          <Text maxWidth="150px" color="white" fontSize="16px">
            Show results list
          </Text>
        </Flex>
      )}
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
              borderColor="blue.200"
            >
              text
            </Radio>
            <Radio
              value="include"
              marginStart="0 !important"
              marginEnd="1rem !important"
              borderColor="blue.200"
            >
              include
            </Radio>
            <Radio
              value="exact"
              marginStart="0 !important"
              marginEnd="1rem !important"
              borderColor="blue.200"
            >
              exact
            </Radio>
            <Radio
              value="include-with-order"
              marginStart="0 !important"
              borderColor="blue.200"
            >
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
            <Radio value="insensitive" borderColor="blue.200">
              insensitive
            </Radio>
            <Radio
              value="sensitive"
              marginStart="1rem !important"
              borderColor="blue.200"
            >
              sensitive
            </Radio>
          </Stack>
        </RadioGroup>
      </Flex>
    </Flex>
  )
}
