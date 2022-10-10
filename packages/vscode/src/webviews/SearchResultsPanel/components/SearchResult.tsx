import { Flex, Text, Link, Checkbox, Button } from '@chakra-ui/react'
import { CodeBlock } from '../../components/CodeBlock'
import dedent from 'dedent'
import { MatchWithFileInfo, Match } from '@codeque/core'
import {
  darkTheme,
  lightTheme,
  MyPrismTheme,
} from '../../components/codeHighlightThemes'
import { eventBusInstance } from '../../../EventBus'
import { useThemeType } from '../../components/useThemeType'
import { useEffect, useState } from 'react'
import { IoMdClose } from 'react-icons/io'

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

  const themeType = useThemeType()
  const highlightTheme = themeType === 'dark' ? darkTheme : lightTheme
  const matchHighlight = [{ ...match.loc, style: matchHighlightStyle }]

  const borderColor = getBorderColor(
    themeType === 'dark',
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

  return (
    <Flex flexDir="column" mb="4">
      <Flex
        p="2"
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        position="sticky"
        top="0px"
        border="1px solid"
        borderColor={borderColor}
        transition="border 0.3s ease-in-out"
        backgroundColor="var(--vscode-editor-background)"
        maxWidth="100%"
      >
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
          <Text as="span">{getRelativePath(match.filePath)}</Text>
          <Text as="span">:</Text>
          <Text as="span" color="#c792ea">
            {match.loc.start.line}
          </Text>
          <Text as="span">:</Text>
          <Text as="span" color="#ffcb8b">
            {match.loc.start.column}
          </Text>
        </Link>
        <Flex
          onClick={(e) => {
            e.stopPropagation()
            removeMatch(match.filePath, match.start, match.end)
          }}
          justifyContent="center"
          alignItems="center"
          ml="3"
          _hover={{ background: highlightTheme.plain.backgroundColor }}
          borderRadius="md"
          width="18px"
        >
          <IoMdClose />
        </Flex>
        <Checkbox
          ml="auto"
          isChecked={isChecked}
          onChange={(ev) => {
            const checked = ev.target.checked
            setIsChecked(checked)
            setIsExpanded(!checked)
          }}
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
            startLineNumber={match.extendedCodeFrame?.startLine}
            theme={highlightTheme}
            dedent={
              (match.extendedCodeFrame?.startLine as number) >=
              match.loc.start.line
            }
            // customHighlight={matchHighlight}
          >
            {match.extendedCodeFrame?.code as string}
          </CodeBlock>
        </Flex>
      ) : null}
    </Flex>
  )
}
