import { Box, Flex, FlexProps } from '@chakra-ui/react'
import SimpleCodeEditor from 'react-simple-code-editor'
import { lightTheme, darkTheme } from './codeHighlightThemes'
import { Highlight, HighlightProps } from './Highlight'

type Props = FlexProps & {
  code: string
  setCode: (code: string) => void
  customHighlight?: HighlightProps['customHighlight']
  theme: 'light' | 'dark'
}

const customTextAreaCn = 'editor-text-area'

export function Editor({
  customHighlight,
  code,
  setCode,
  theme: themeType,
  ...rest
}: Props) {
  const theme = themeType === 'dark' ? darkTheme : lightTheme

  return (
    <Flex {...rest}>
      {/* <code> is used to infer font family */}
      <Box
        as="code"
        display="block"
        width="100%"
        overflow="auto"
        whiteSpace="pre"
      >
        {/* Text area cursor is hidden on highlight without this styles */}
        <style>
          {`
          .${customTextAreaCn} {
            z-index: 1;
            white-space: pre !important;
          }

          .${customTextAreaCn}:focus {
            outline: none;
          }

          .${customTextAreaCn} ~ * {
            white-space: pre !important;
          }
        `}
        </style>
        {/* @ts-ignore */}
        <SimpleCodeEditor
          value={code}
          onValueChange={setCode}
          highlight={(code) => (
            <Highlight
              theme={theme}
              highlight
              customHighlight={customHighlight}
              // startLineNumber={1}
            >
              {code}
            </Highlight>
          )}
          padding={10}
          style={{
            ...theme.plain,
            // outline: "none",
            minWidth: '100%',
            minHeight: '100%',
            whiteSpace: 'pre',
            overflow: 'initial',
            float: 'left'
          }}
          textareaClassName={customTextAreaCn}
        />
      </Box>
    </Flex>
  )
}
