import PrismHighlight from 'prism-react-renderer'
import { defaultProps, PrismTheme } from 'prism-react-renderer'
import { darkTheme } from './codeHighlightThemes'

type Token = { types: string[]; content: string }

export const codeRed = 'rgb(220 72 72)'

export type HighlightProps = {
  children: string
  theme?: PrismTheme
  customHighlight?: {
    line?: number
    start?: {
      line: number
      column: number
    }
    end?: {
      line: number
      column: number
    }
    style: any
  }[]
  dedent?: boolean
  highlight?: boolean
  isMultiLine?: boolean
  startLineNumber?: number
}

export function Highlight({
  children,
  theme = darkTheme,
  customHighlight,
  highlight,
  startLineNumber
}: HighlightProps) {
  const safeStartLineNumber = startLineNumber ?? 0

  if (!highlight) {
    return <span>{children}</span>
  }

  return (
    // @ts-ignore
    <PrismHighlight
      {...defaultProps}
      code={children}
      language="tsx"
      theme={theme}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, lineIdx) => {
            const showLineNumber =
              startLineNumber !== undefined
                ? lineIdx + startLineNumber
                : undefined

            const lineNumToCompareHighlight = lineIdx + safeStartLineNumber

            let lineCurrentChar = 0
            const customLineStyle = customHighlight?.find((highlight) => {
              const wholeLineHighlight = highlight.line !== undefined

              return (
                wholeLineHighlight &&
                lineNumToCompareHighlight === highlight.line
              )
            })?.style

            return (
              <div
                {...getLineProps({ line, key: lineIdx })}
                style={
                  tokens.length === 1
                    ? { display: 'inline', ...customLineStyle }
                    : customLineStyle
                }
              >
                {showLineNumber !== undefined ? (
                  <span
                    style={{
                      pointerEvents: 'none',
                      color: 'gray',
                      userSelect: 'none',
                      display: 'inline-block',
                      width:
                        (tokens.length + showLineNumber).toString().length * 8 +
                        10 +
                        'px'
                    }}
                  >
                    {showLineNumber}
                  </span>
                ) : null}
                {line.map((token, key) => {
                  const maybeSplit = maybeSplitJSXToken(token)

                  const customTokenStyle = customHighlight?.find(
                    (highlight) => {
                      const wholeLineHighlight = highlight.line !== undefined

                      if (!wholeLineHighlight) {
                        const startLine = highlight?.start?.line
                        const startCol = highlight?.start?.column
                        const endLine = highlight?.end?.line
                        const endCol = highlight?.end?.column

                        if (
                          startLine === undefined ||
                          startCol === undefined ||
                          endLine === undefined ||
                          endCol === undefined
                        ) {
                          return false
                        }

                        // center line, highlight whole line
                        if (
                          lineNumToCompareHighlight > startLine &&
                          lineNumToCompareHighlight < endLine
                        ) {
                          return true
                        }

                        // match is in one line, check if tokens are in bounds
                        if (
                          startLine === endLine &&
                          lineNumToCompareHighlight === startLine
                        ) {
                          return (
                            startCol < lineCurrentChar + token.content.length &&
                            endCol > lineCurrentChar
                          )
                        }

                        // start/end line of multiline match
                        return (
                          (lineNumToCompareHighlight === startLine &&
                            lineCurrentChar >= startCol) ||
                          (lineNumToCompareHighlight === endLine &&
                            lineCurrentChar + token.content.length <= endCol)
                        )
                      }
                    }
                  )?.style

                  lineCurrentChar += token.content.length

                  if (Array.isArray(maybeSplit)) {
                    return (
                      <>
                        {maybeSplit.map((splitToken, i) => {
                          const props = customGetTokenProps(
                            {
                              token: splitToken,
                              key: `${key}.${i}`
                            },
                            getTokenProps
                          )

                          return (
                            <span
                              {...props}
                              style={{ ...props.style, ...customTokenStyle }}
                            />
                          )
                        })}
                      </>
                    )
                  }

                  const props = customGetTokenProps(
                    { token: token, key: key },
                    getTokenProps
                  )

                  return (
                    <span
                      {...props}
                      style={{ ...props.style, ...customTokenStyle }}
                    />
                  )
                })}
              </div>
            )
          })}
        </>
      )}
    </PrismHighlight>
  )
}

const maybeSplitJSXToken = (token: Token) => {
  const isJSX = /^\s*?<\/?\s*?(\w|\$)+\s*?\/?>\s*?$/gm

  if (token.types[0] === 'plain-text' && token.content.match(isJSX) !== null) {
    const trimmed = token.content

    const tokens = [] as Token[]

    const whitespaceMatch = /^\s*/gm

    const initialWhitespace = trimmed.match(whitespaceMatch)?.[0] || ''

    tokens.push({
      types: ['plain-text'],
      content: initialWhitespace
    })

    if (trimmed.includes('</')) {
      tokens.push({
        types: ['tag', 'punctuation'],
        content: '</'
      })
    } else if (trimmed.includes('<')) {
      tokens.push({
        types: ['tag', 'punctuation'],
        content: '<'
      })
    }

    const identifierMatcher = /\s*?(\w|\$)+\s*?/gm

    tokens.push({
      types: ['tag', 'class-name'],
      content: trimmed.match(identifierMatcher)?.[0] as string
    })

    if (trimmed.includes('/>')) {
      tokens.push({
        types: ['tag', 'punctuation'],
        content: '/>'
      })
    } else if (trimmed.includes('>')) {
      tokens.push({
        types: ['tag', 'punctuation'],
        content: '>'
      })
    }

    return tokens
  }

  return token
}

const customGetTokenProps = (
  input: { token: Token; key: number | string },
  defaultGetTokenProps: (input: { token: Token; key: number }) => {
    children: React.ReactNode
    style?: Record<string, unknown>
  }
) => {
  const defaultProps = defaultGetTokenProps(
    input as { token: Token; key: number }
  )

  let isWildcard = false

  if (input.token.content.match(/\$\$\$?/)) {
    isWildcard = true
  }

  if (input.token.types.includes('number') && input.token.content === '0x0') {
    isWildcard = true
  }

  return {
    ...defaultProps,
    style: {
      ...defaultProps.style,
      ...(isWildcard
        ? {
            color: codeRed,
            fontWeight: 'bold'
          }
        : {})
    }
  }
}
