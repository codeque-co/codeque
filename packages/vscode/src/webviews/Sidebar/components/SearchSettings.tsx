import {
  Box,
  Checkbox,
  Flex,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Link,
} from '@chakra-ui/react'
import Creatable from 'react-select/creatable'

import { Mode } from '@codeque/core'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { eventBusInstance } from '../../../EventBus'
import { StateShape } from '../../../StateManager'
import { CaseType } from '../../../types'
import { reactSelectStyles } from '../../components/reactSelectStyles'
import { simpleDebounce } from '../../../utils'

type SearchSettingsProps = {
  initialSettings: StateShape
  setSettings: (settings: Partial<StateShape>) => void
  resultsPanelVisible: boolean
}
type Options = { value: string; label: string }[]

const formatCreateLabel = (input: string) => `Add "${input}"`
const noOptionsMessage = () => 'Type relative path or glob'

const getOptionsFromArray = (values: string[]) =>
  values.map((value) => ({ value, label: value }))

const getValuesFromOptions = (options: Options) =>
  options.map(({ value }) => value)

export function SearchSettings({
  initialSettings,
  setSettings,
  resultsPanelVisible,
}: SearchSettingsProps) {
  const [mode, setMode] = useState(initialSettings?.mode)
  const [fileType, setFileType] = useState(initialSettings?.fileType)

  const [caseType, setCase] = useState(initialSettings?.caseType)
  const [searchNodeModules, setSearchNodeModules] = useState(
    initialSettings?.searchNodeModules,
  )
  const [searchIgnoredFiles, setSearchIgnoredFiles] = useState(
    initialSettings?.searchIgnoredFiles,
  )
  const [searchBigFiles, setSearchBigFiles] = useState(
    initialSettings?.searchBigFiles,
  )
  const [include, setInclude] = useState(
    getOptionsFromArray(initialSettings?.include ?? []),
  )
  const [exclude, setExclude] = useState(
    getOptionsFromArray(initialSettings?.exclude ?? []),
  )
  const [entryPoint, setEntryPoint] = useState(
    initialSettings?.entryPoint ?? '',
  )

  // Handle initial settings change from backend
  useEffect(() => {
    // We handle only mode change for now
    if (initialSettings.mode !== undefined) {
      setMode(initialSettings.mode)
    }

    if (initialSettings.caseType !== undefined) {
      setCase(initialSettings.caseType)
    }

    if (initialSettings.entryPoint !== undefined) {
      setEntryPoint(initialSettings.entryPoint ?? '')
    }

    if (initialSettings.include !== undefined) {
      setInclude(getOptionsFromArray(initialSettings?.include ?? []))
    }

    if (initialSettings.exclude !== undefined) {
      setExclude(getOptionsFromArray(initialSettings?.exclude ?? []))
    }

    if (initialSettings.searchIgnoredFiles !== undefined) {
      setSearchIgnoredFiles(initialSettings.searchIgnoredFiles)
    }

    if (initialSettings.searchNodeModules !== undefined) {
      setSearchNodeModules(initialSettings.searchNodeModules)
    }

    if (initialSettings.searchBigFiles !== undefined) {
      setSearchBigFiles(initialSettings.searchBigFiles)
    }
  }, [initialSettings])

  const handleModeChange = useCallback(
    (mode: Mode) => {
      setMode(mode)

      setSettings({
        mode,
      })
    },
    [setSettings],
  )

  const handleFileTypeChange = useCallback(
    (fileType: StateShape['fileType']) => {
      let newMode = mode

      if (fileType === 'all') {
        newMode = 'text'
      }

      setFileType(fileType)
      setMode(newMode)

      setSettings({
        fileType,
        mode: newMode,
      })
    },
    [setSettings, mode],
  )

  const handleCaseChange = useCallback(
    (caseType: CaseType) => {
      setCase(caseType)

      setSettings({
        caseType,
      })
    },
    [setSettings],
  )

  const handleSearchNodeModulesChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const checked = ev.target.checked
      setSearchNodeModules(checked)

      setSettings({
        searchNodeModules: checked,
      })
    },
    [setSettings],
  )

  const handleSearchIgnoredFilesChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const checked = ev.target.checked
      setSearchIgnoredFiles(checked)

      setSettings({
        searchIgnoredFiles: checked,
      })
    },
    [setSettings],
  )

  const handleSearchBigFiles = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const checked = ev.target.checked
      setSearchBigFiles(checked)

      setSettings({
        searchBigFiles: checked,
      })
    },
    [setSettings],
  )

  const handleIncludeChange = useCallback(
    (options: Options) => {
      setInclude(options)
      const include = getValuesFromOptions(options)

      setSettings({
        include,
      })
    },
    [setSettings],
  )

  const handleExcludeChange = useCallback(
    (options: Options) => {
      setExclude(options)
      const exclude = getValuesFromOptions(options)

      setSettings({
        exclude,
      })
    },
    [setSettings],
  )

  const setSettingsEntryPointDebounced = useMemo(
    () =>
      simpleDebounce((entryPoint: string) => {
        setSettings({
          entryPoint: entryPoint.length > 0 ? entryPoint : null,
        })
      }, 800),
    [setSettings],
  )

  const handleEntryPointChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const entryPoint = ev.target.value

      setEntryPoint(entryPoint)
      setSettingsEntryPointDebounced(entryPoint)
    },
    [setSettings, setSettingsEntryPointDebounced],
  )

  const showResultsPanel = () => {
    eventBusInstance.dispatch('show-results-panel')
  }

  const allFileTypesSelected = fileType === 'all'

  const disabledSearchModeCursorProps = allFileTypesSelected
    ? ({
        cursor: 'not-allowed',
      } as const)
    : {}
  const disabledSearchModeProps = allFileTypesSelected
    ? ({
        pointerEvents: 'none',
        opacity: '0.6',
      } as const)
    : {}

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
      <Flex flexDir="column">
        <Text fontWeight="medium" mb="3" fontSize="lg">
          Query settings
        </Text>
        <Text fontWeight="medium" mb="1">
          File types:
        </Text>
        <Flex mb="4" alignItems="center">
          <RadioGroup value={fileType} onChange={handleFileTypeChange}>
            <Stack direction="row" flexWrap="wrap">
              <Radio
                value="all"
                marginEnd="1rem !important"
                marginStart="0 !important"
                borderColor="blue.200"
              >
                All
              </Radio>
              <Radio
                value="js-ts-json"
                marginStart="0 !important"
                marginEnd="1rem !important"
                borderColor="blue.200"
              >
                JS/TS/JSON
              </Radio>
              <Radio
                value="html"
                marginStart="0 !important"
                marginEnd="1rem !important"
                borderColor="blue.200"
              >
                HTML
              </Radio>
            </Stack>
          </RadioGroup>
        </Flex>
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
              <Flex {...disabledSearchModeCursorProps}>
                <Flex {...disabledSearchModeProps}>
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
                </Flex>
              </Flex>
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
      <Flex flexDir="column">
        <Text fontWeight="medium" my="3" fontSize="lg">
          Files list settings
        </Text>
        <Checkbox
          isChecked={searchIgnoredFiles}
          onChange={handleSearchIgnoredFilesChange}
        >
          Search ignored files
        </Checkbox>
        <Checkbox
          mt="2"
          isChecked={searchNodeModules}
          onChange={handleSearchNodeModulesChange}
        >
          Search <code>node_modules</code>
        </Checkbox>
        <Checkbox
          mt="2"
          isChecked={searchBigFiles}
          onChange={handleSearchBigFiles}
        >
          Search files above 100kb
        </Checkbox>
        <Text fontWeight="medium" mb="1" mt="2">
          Include files or directories
        </Text>
        <Box
          mb="2"
          transform="scale(0.85)"
          transformOrigin="left"
          zIndex="3"
          width="117%"
        >
          <Creatable
            isMulti={true}
            placeholder={noOptionsMessage()}
            noOptionsMessage={noOptionsMessage}
            formatCreateLabel={formatCreateLabel}
            //@ts-ignore react-select things...
            onChange={handleIncludeChange}
            value={include}
            styles={reactSelectStyles}
          />
        </Box>
        <Text fontWeight="medium" my="1">
          Exclude files or directories
        </Text>
        <Box
          transform="scale(0.85)"
          transformOrigin="left"
          width="117%"
          zIndex="2"
        >
          <Creatable
            isMulti={true}
            placeholder={noOptionsMessage()}
            noOptionsMessage={noOptionsMessage}
            formatCreateLabel={formatCreateLabel}
            //@ts-ignore react-select things...
            onChange={handleExcludeChange}
            value={exclude}
            styles={reactSelectStyles}
          />
        </Box>
        <Text fontWeight="medium" my="1">
          Search by entry point (<i>JS/TS only</i>)
        </Text>
        <Input
          border="none"
          outlineColor="transparent !important"
          outline="none !important"
          mt="2"
          onChange={handleEntryPointChange}
          value={entryPoint}
          placeholder="Entry point relative path"
          size="sm"
        />
      </Flex>
      <Flex flexDir="column" marginTop="auto" alignItems="center">
        <Link
          href="https://codeque.co/docs"
          color="var(--vscode-textLink-foreground);"
        >
          Documentation
        </Link>
        <Link
          href="https://github.com/codeque-co/codeque/issues"
          color="var(--vscode-textLink-foreground);"
        >
          Report a bug
        </Link>
        <Link
          href="https://github.com/codeque-co/codeque/issues"
          color="var(--vscode-textLink-foreground);"
        >
          Ask for help
        </Link>
      </Flex>
    </Flex>
  )
}
