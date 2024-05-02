import { MatchWithFileInfo } from '@codeque/core'
import { Flex, IconButton } from '@chakra-ui/react'
import { SearchResult } from './SearchResult'
import { FileLink } from './FileLink'
import { useState, useCallback, useRef, useEffect } from 'react'
import { HiOutlineChevronDown, HiOutlineChevronRight } from 'react-icons/hi'
import { darkTheme, lightTheme } from '../../components/codeHighlightThemes'
import { useThemeType } from '../../components/useThemeType'
import { getIconButtonProps, groupHeaderHeight, getBorderColor } from './utils'
import { IoMdClose } from 'react-icons/io'
import { DoubleClickButton } from '../../components/DoubleClickButton'
import { CopyButton } from '../../components/CopyButton'
import { usePreventScrollJump } from './usePreventScrollJump'
import { zIndices } from '../../components/zIndices'

type FileGroupProps = {
  matches: MatchWithFileInfo[]
  filePath: string
  getRelativePath: (filePath: string) => string | undefined
  removeMatch: (filePath: string, start: number, end: number) => void
  removeFile: (filePath: string) => void
  hasWorkspace: boolean
  scrollElRef: React.MutableRefObject<HTMLDivElement | null>
}

export function FileGroup({
  matches,
  getRelativePath,
  filePath,
  removeMatch,
  removeFile,
  hasWorkspace,
  scrollElRef,
}: FileGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const [isResultFocused, setIsResultFocused] = useState(false)

  const preventScrollJump = usePreventScrollJump(
    wrapperRef,
    headingRef,
    scrollElRef,
  )

  const themeType = useThemeType()
  const isDarkTheme = themeType === 'dark'
  const highlightTheme = isDarkTheme ? darkTheme : lightTheme

  const iconButtonStyleResetProps = getIconButtonProps(
    highlightTheme.plain.backgroundColor,
  )

  const relativeFilePath = getRelativePath(filePath) ?? ''
  const borderColor = getBorderColor(
    isDarkTheme,
    isResultFocused,
    highlightTheme,
  )

  useEffect(() => {
    const handleWindowFocus = () => {
      setIsResultFocused(false)
    }

    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  const allMatchesLocations = matches.map((match) => match.loc)

  return (
    <Flex
      key={filePath}
      width="100%"
      flexDir="column"
      ref={wrapperRef}
      pl={hasWorkspace ? '4' : '0'}
    >
      <Flex
        position="sticky"
        top={hasWorkspace ? groupHeaderHeight : '0px'}
        backgroundColor="var(--vscode-editor-background)"
        transition="border 0.3s ease-in-out"
        zIndex={zIndices.fileGroup}
        px="1"
        border="1px solid"
        borderColor={borderColor}
        height={groupHeaderHeight}
        alignItems="center"
        ref={headingRef}
        maxWidth="100%"
      >
        <IconButton
          onClick={() => {
            if (isExpanded) {
              preventScrollJump()
            }

            setIsExpanded(!isExpanded)
          }}
          aria-label="expand/collapse button"
          icon={
            isExpanded ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />
          }
          {...iconButtonStyleResetProps}
          mr="2"
        />
        <FileLink
          filePath={filePath}
          locationsToSelect={allMatchesLocations}
          locationsToDecorate={allMatchesLocations}
          relativeFilePath={relativeFilePath}
          onClick={() => {
            setIsResultFocused(true)
          }}
          maxWidth="calc(100% - 110px)"
        />
        <Flex ml="2" mr="auto">
          <CopyButton
            value={relativeFilePath}
            ariaLabel="Copy file path"
            onCopyText="File path copied to clipboard!"
          />
        </Flex>
        <Flex ml="2">({matches.length})</Flex>
        <DoubleClickButton
          iconButton
          icon={<IoMdClose />}
          confirmText="Click again to remove"
          {...iconButtonStyleResetProps}
          onClick={(e) => {
            e.stopPropagation()
            preventScrollJump()
            removeFile(filePath)
          }}
          ml="3"
          borderRadius="md"
          tooltipPlacement="bottom-end"
        />
      </Flex>
      <Flex
        width="100%"
        flexDir="column"
        gap="4"
        display={isExpanded ? 'flex' : 'none'}
      >
        {matches.map((match) => {
          const key = `${match.filePath}-${match.start}-${match.end}`

          return (
            <SearchResult
              key={key}
              match={match}
              getRelativePath={getRelativePath}
              removeMatch={removeMatch}
              hasGroup={true}
              hasWorkspace={hasWorkspace}
              scrollElRef={scrollElRef}
              allMatchesLocations={allMatchesLocations}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
