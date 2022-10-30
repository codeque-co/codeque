import {
  Checkbox,
  Flex,
  IconButton,
  Link,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import { Match, MatchWithFileInfo } from '@codeque/core'
import { useEffect, useState } from 'react'
import { HiOutlineChevronDown, HiOutlineChevronRight } from 'react-icons/hi'
import { IoMdClose } from 'react-icons/io'
import { MdContentCopy } from 'react-icons/md'
import { eventBusInstance } from '../../../EventBus'
import { CodeBlock } from '../../components/CodeBlock'
import {
  darkTheme,
  lightTheme,
  MyPrismTheme,
} from '../../components/codeHighlightThemes'
import { DoubleClickButton } from '../../components/DoubleClickButton'
import { useThemeType } from '../../components/useThemeType'
import { useCopyToClipboard } from '../../components/useCopyToClipboard'

type SearchResultProps = {
  match: MatchWithFileInfo
  getRelativePath: (filePath: string) => string | undefined
  removeMatch: (filePath: string, start: number, end: number) => void
}

const highlightColorOnLight = 'rgb(249,245,182)'
const highlightColorOnDark = '#366186'

const matchHighlightStyle = {
  backgroundColor: highlightColorOnDark,
  boxShadow: `0px 5px 0px ${highlightColorOnDark}, 0px -5px 0px ${highlightColorOnDark}`,
}

const getBorderColor = (
  isDarkTheme: boolean,
  isFocused: boolean,
  theme: MyPrismTheme,
) => {
  if (isDarkTheme && !isFocused) {
    return theme.plain.backgroundColor
  }

  if (!isDarkTheme && !isFocused) {
    return 'gray.300'
  }

  return 'blue.200'
}

export function SearchResult({
  match,
  getRelativePath,
  removeMatch,
}: SearchResultProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isChecked, setIsChecked] = useState(false)
  const [isResultFocused, setIsResultFocused] = useState(false)

  const openFile = (data: { filePath: string; location: Match['loc'] }) => {
    eventBusInstance.dispatch('open-file', data)
  }

  const relativeFilePath = getRelativePath(match.filePath)
  const matchStartLine = match.loc.start.line
  // Vscode columns are indexed from 1, while result is indexed from 0
  const matchStartCol = match.loc.start.column + 1
  const fullFilePath = `${relativeFilePath}:${matchStartLine}:${matchStartCol}`
  const [hasCopiedFilePath, copyFilePath] = useCopyToClipboard(fullFilePath)
  const themeType = useThemeType()
  const highlightTheme = themeType === 'dark' ? darkTheme : lightTheme
  const matchHighlight = [{ ...match.loc, style: matchHighlightStyle }]

  const borderColor = getBorderColor(
    themeType === 'dark',
    isResultFocused,
    highlightTheme,
  )

  const iconButtonStyleResetProps = {
    variant: 'ghost',
    height: 'auto',
    minWidth: '18px',
    width: '18px',
    _hover: { background: highlightTheme.plain.backgroundColor },
    _active: { background: highlightTheme.plain.backgroundColor },
    size: 'sm',
  }

  useEffect(() => {
    const handleWindowFocus = () => {
      setIsResultFocused(false)
    }

    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  const extendedCodeFrame = match.extendedCodeFrame
  const firstCharIsWhitespace = /\s/.test(
    match.extendedCodeFrame?.code[0] ?? '',
  )

  return (
    <Flex flexDir="column" mb="4">
      <Flex
        p="2"
        // onClick={() => setIsExpanded(!isExpanded)}
        position="sticky"
        top="0px"
        border="1px solid"
        borderColor={borderColor}
        transition="border 0.3s ease-in-out"
        backgroundColor="var(--vscode-editor-background)"
        maxWidth="100%"
      >
        <IconButton
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="expand/collapse button"
          icon={
            isExpanded ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />
          }
          {...iconButtonStyleResetProps}
          mr="2"
        />
        <Link
          onClick={(ev) => {
            ev.stopPropagation()
            setIsResultFocused(true)

            openFile({
              filePath: match.filePath,
              location: match.loc,
            })
          }}
          fontWeight="500"
          style={{
            direction: 'rtl',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            maxWidth: '90%',
          }}
        >
          <Text as="span">{relativeFilePath}</Text>
          <Text as="span">:</Text>
          <Text as="span" color="#c792ea">
            {matchStartLine}
          </Text>
          <Text as="span">:</Text>
          <Text as="span" color="#ffcb8b">
            {matchStartCol}
          </Text>
        </Link>
        <Flex ml="2" mr="auto">
          <IconButton
            aria-label="copy file path"
            icon={<MdContentCopy />}
            {...iconButtonStyleResetProps}
            onClick={copyFilePath}
          />
          {hasCopiedFilePath && (
            <Tooltip label="Copied to clipboard!" defaultIsOpen={true}>
              <span />
            </Tooltip>
          )}
        </Flex>
        <Checkbox
          ml="3"
          isChecked={isChecked}
          onChange={(ev) => {
            const checked = ev.target.checked
            setIsChecked(checked)
            setIsExpanded(!checked)
          }}
        >
          Done
        </Checkbox>
        <DoubleClickButton
          iconButton
          icon={<IoMdClose />}
          confirmText="Click again to remove"
          {...iconButtonStyleResetProps}
          onClick={(e) => {
            e.stopPropagation()
            removeMatch(match.filePath, match.start, match.end)
          }}
          ml="3"
          borderRadius="md"
          tooltipPlacement="bottom-end"
        />
      </Flex>
      {isExpanded ? (
        <Flex
          padding="5"
          background={highlightTheme.plain.backgroundColor}
          overflowX="auto"
          border={themeType !== 'dark' ? '1px solid' : ''}
          borderTopWidth={0}
          borderColor="gray.300"
        >
          <CodeBlock
            startLineNumber={extendedCodeFrame?.startLine}
            theme={highlightTheme}
            dedent={
              firstCharIsWhitespace &&
              (extendedCodeFrame?.startLine as number) >= match.loc.start.line
            }
            // customHighlight={matchHighlight}
          >
            {extendedCodeFrame?.code as string}
          </CodeBlock>
        </Flex>
      ) : null}
    </Flex>
  )
}
