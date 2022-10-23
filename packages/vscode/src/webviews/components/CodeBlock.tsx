import dedent from 'dedent'
import { darkTheme } from './codeHighlightThemes'
import { Highlight, HighlightProps } from './Highlight'

export type CodeBlockProps = HighlightProps

export function CodeBlock({
  children,
  theme = darkTheme,
  dedent: _dedent = true,
  highlight = true,
  isMultiLine: _isMultiLine,
  ...props
}: CodeBlockProps) {
  const code = _dedent ? dedent(children) : children.trimEnd()

  const isMultiLine = _isMultiLine ?? code.includes('\n')

  return (
    <div
      style={{
        ...theme.plain,
        whiteSpace: 'pre',
        fontFamily: 'SFMono-Regular,Menlo,Monaco,Consolas,monospace', // taken from chakra defaults
        display: isMultiLine ? 'block' : 'inline',
      }}
    >
      <Highlight theme={theme} highlight={highlight} {...props}>
        {code}
      </Highlight>
    </div>
  )
}
