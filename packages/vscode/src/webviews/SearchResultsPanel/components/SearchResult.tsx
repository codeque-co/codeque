import {
  Checkbox,
  Flex,
  IconButton,
  Link,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import { Match, MatchWithFileInfo } from '@codeque/core'
import { useCallback, useEffect, useRef, useState } from 'react'
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

const highlightColorOnLight = '#ddebf2'

const highlightColorOnDark = '#35485b'

const getMatchHighlightStyle = (isDark: boolean) => {
  const highlightColor = isDark ? highlightColorOnDark : highlightColorOnLight

  return {
    backgroundColor: highlightColor,
    boxShadow: `0px 5px 0px ${highlightColor}, 0px -5px 0px ${highlightColor}`,
  }
}

const removeWhiteSpaces = (str: string) => str.replace(/\s+/g, '')

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
  const wrapperRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  const [isExpanded, setIsExpanded] = useState(true)
  const [isChecked, setIsChecked] = useState(false)
  const [isResultFocused, setIsResultFocused] = useState(false)

  const openFile = (data: { filePath: string; location: Match['loc'] }) => {
    eventBusInstance.dispatch('open-file', data)
  }

  let relativeFilePath = getRelativePath(match.filePath)
  const matchStartLine = match.loc.start.line
  // Vscode columns are indexed from 1, while result is indexed from 0
  const matchStartCol = match.loc.start.column + 1
  const fullFilePath = `${relativeFilePath}:${matchStartLine}:${matchStartCol}`
  const [hasCopiedFilePath, copyFilePath] = useCopyToClipboard(fullFilePath)
  const themeType = useThemeType()
  const isDarkTheme = themeType === 'dark'
  const highlightTheme = isDarkTheme ? darkTheme : lightTheme

  const borderColor = getBorderColor(
    isDarkTheme,
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
  const extendedCodeFrameCode = extendedCodeFrame.code

  const initialWhitespaceSequenceMatch = extendedCodeFrameCode.match(/^\s*/g)

  const initialWhitespaceSequence =
    initialWhitespaceSequenceMatch !== null
      ? initialWhitespaceSequenceMatch[0]
      : ''

  const containsInitialWhitespace = initialWhitespaceSequence.length > 0

  const shouldDedentResult =
    containsInitialWhitespace &&
    (extendedCodeFrame.startLine as number) >= match.loc.start.line

  const shouldHighlight =
    removeWhiteSpaces(extendedCodeFrameCode).length !==
    removeWhiteSpaces(match.code).length

  const highlightColumnChangeDueToDedent = shouldDedentResult
    ? initialWhitespaceSequence.length
    : 0

  const matchHighlight = [
    {
      start: {
        line: match.loc.start.line,
        column: match.loc.start.column - highlightColumnChangeDueToDedent,
      },
      end: {
        line: match.loc.end.line,
        column: match.loc.end.column - highlightColumnChangeDueToDedent,
      },
      style: getMatchHighlightStyle(isDarkTheme),
    },
  ]

  const filePathStartsWithDot = relativeFilePath?.startsWith('.')

  if (filePathStartsWithDot) {
    relativeFilePath = relativeFilePath?.substring(1)
  }

  const preventScrollJump = useCallback(() => {
    if (wrapperRef.current && headingRef.current) {
      const wrapperTop = wrapperRef.current.getBoundingClientRect().top
      const headingTop = headingRef.current.getBoundingClientRect().top

      const isHeadingSticky = wrapperTop < headingTop

      if (isHeadingSticky) {
        wrapperRef.current.scrollIntoView({
          block: 'start',
        })
      }
    }
  }, [])

  return (
    <Flex flexDir="column" mb="4" ref={wrapperRef}>
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
        ref={headingRef}
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
          maxWidth="calc(100% - 150px)"
          display="inline-flex"
        >
          {/** workaround for a problem with initial dot being moved to the end of string when using rtl */}
          {filePathStartsWithDot && <Text as="span">.</Text>}
          <Text
            as="div"
            style={{
              textAlign: 'left',
              direction: 'rtl',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
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
            const checked = ev.target.checked // changed to checked

            if (checked) {
              preventScrollJump()
            }

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
            preventScrollJump()
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
            startLineNumber={extendedCodeFrame.startLine}
            theme={highlightTheme}
            dedent={shouldDedentResult}
            customHighlight={matchHighlight}
          >
            {extendedCodeFrameCode}
          </CodeBlock>
        </Flex>
      ) : null}
    </Flex>
  )
}
