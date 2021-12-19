//@ts-nocheck
var readline = require('readline');
const fs = require('fs')
var colors = require('colorette')
const jsTokens = require("./js-tokens-fork");
import { format } from 'prettier'

function tokenize(code) {
    const tokens = Array.from(jsTokens(code))
    return tokens.reduce((coloredCode, token) => {
        let coloredToken = ''
        if (token.type === 'StringLiteral') {
            coloredToken = colors.green(token.value)
        }
        else if (token.type === 'IdentifierName') {
            const keywords = [
                'abstract', 'arguments', 'async', 'await', 'boolean',
                'break', 'byte', 'case', 'catch',
                'char', 'class', 'const', 'continue',
                'debugger', 'default', 'delete', 'do',
                'double', 'else', 'enum', 'eval',
                'export', 'extends', 'false', 'final',
                'finally', 'float', 'for', 'function',
                'goto', 'if', 'implements', 'import',
                'in', 'instanceof', 'int', 'interface',
                'let', 'long', 'native', 'new',
                'null', 'package', 'private', 'protected',
                'public', 'return', 'short', 'static',
                'super', 'switch', 'synchronized', 'this',
                'throw', 'throws', 'transient', 'true',
                'try', 'typeof', 'var', 'void',
                'volatile', 'while', 'with', 'yield', 'type', 'interface', 'as', 'any'
            ]
            if (keywords.includes(token.value)) {
                coloredToken = colors.cyan(token.value)

            }
            else {
                coloredToken = colors.white(token.value)
            }

        }
        else if (token.type === 'NumericLiteral') {
            coloredToken = colors.magenta(token.value)
        }
        else if (token.type === 'Punctuator') {
            if (['[', ']', '{', '}'].includes(token.value)) {
                coloredToken = colors.white(token.value)
            } else {
                coloredToken = colors.yellow(token.value)
            }
        }
        else if (token.type === 'RegularExpressionLiteral') {
            coloredToken = colors.red(token.value)
        }
        else {
            coloredToken = token.value
        }
        return coloredCode + coloredToken
    }, '')
}

const newLineSequence = '\n'

const footerDefault = [
    'Shortcuts:',
    '',
    '🔍  Ctrl+s 👉 search!',
    '💅🏾  Ctrl+f 👉 format code',
    '🔢  Ctrl+b 👉 toggle line numbers',
    '🧹  2 x Ctrl+p 👉 clean query',
    '🚪  Ctrl+c 👉 cancel and exit',
].join(newLineSequence)

const logErrorFileName = 'editor-log.txt'

export const openAsyncEditor = ({ header = '', code = '', footer = footerDefault, debug = false }) => {
    if (debug) {
        fs.writeFileSync(logErrorFileName, '');
    }

    return new Promise<string>((resolve) => {
        const log = (...strings) => {
            if (debug) {
                fs.appendFileSync(logErrorFileName, strings.join(' ') + '\n');
            }
        }

        const outputStream = process.stdout

        let content: string = code

        function flush() {
            readline.cursorTo(outputStream, 0, 0)
            readline.clearScreenDown(outputStream)
        }

        const cursorTopOffset = header.split(newLineSequence).length + 1
        const defaultLeftOffset = 3 + 1 + 1 + 1 // line num + space + pipe + space

        let cursorLeftOffset = defaultLeftOffset
        const cursorPos = {
            x: cursorLeftOffset,
            y: cursorTopOffset,
        }

        const getCursorYWithOffset = () => cursorPos.y - cursorTopOffset
        const getCursorXWithOffset = () => cursorPos.x - cursorLeftOffset


        const updateCursor = () => {
            log(process.stdout.rows, cursorPos.y)
            readline.cursorTo(outputStream, cursorPos.x, cursorPos.y)
        }

        const fixCursorOverflow = (content) => {
            const lines = content.split(newLineSequence)

            if (getCursorYWithOffset() > lines.length - 1) {
                cursorPos.y = lines.length - 1 + cursorTopOffset
            }

            const lineLen = lines[getCursorYWithOffset()].length

            if (getCursorXWithOffset() > lineLen) {
                cursorPos.x = lineLen + cursorLeftOffset
            }


        }

        const cursorUp = (content) => {
            cursorPos.y = Math.max(cursorPos.y - 1, cursorTopOffset)
            fixCursorOverflow(content)
        }

        const cursorPrevLineEnd = (content) => {
            cursorUp(content)
            cursorRight(content, Infinity)
        }

        const cursorLeft = () => {
            cursorPos.x = Math.max(getCursorXWithOffset() - 1, 0) + cursorLeftOffset
        }

        const cursorRight = (content, progress = 1) => {
            const lineLen = content.split(newLineSequence)[getCursorYWithOffset()].length
            cursorPos.x = Math.min(getCursorXWithOffset() + progress, lineLen) + cursorLeftOffset
        }

        const cursorDown = (content, progress = 1) => {
            const linesCount = content.split(newLineSequence).length
            cursorPos.y = Math.min(cursorPos.y + progress, linesCount - 1 + cursorTopOffset)
            fixCursorOverflow(content)
        }

        const print = () => {
            flush();

            const headerFormatted = header + newLineSequence + newLineSequence
            const footerFormatted = footer.padStart(header.split(newLineSequence).length + footer.length + Math.max(1, 15 - content.split(newLineSequence).length), '\n')
            const tokenized = tokenize(content)
            const lines = tokenized.split(newLineSequence)
            const contentWithLineNumbers = lines.map((line, idx) => `${colors.gray(`${idx + 1}`.padStart(3)) + colors.gray(' | ')}${line}`).join(newLineSequence)
            if (cursorLeftOffset === defaultLeftOffset) {
                outputStream.write(headerFormatted + contentWithLineNumbers + footerFormatted)
            }
            else {
                outputStream.write(headerFormatted + tokenized + footerFormatted)
            }

            updateCursor()
        }
        let cleanPressCounter = 0
        process.stdin.on('keypress', (char, key) => {
            if (key.name === 's' && key.ctrl) {
                log('exit')
                flush()
                rl.close()
                resolve(content)
                return;
            }

            if (key.name === 'b' && key.ctrl) {
                log('line numbers')
                cursorLeftOffset = cursorLeftOffset === defaultLeftOffset ? 0 : defaultLeftOffset
                cursorRight(content, Infinity)
            }

            if (key.name === 'p' && key.ctrl) {
                cleanPressCounter++
                if (cleanPressCounter > 1) {
                    log('clean')
                    content = ''
                    fixCursorOverflow(content)
                    cleanPressCounter = 0
                }
            } else {
                cleanPressCounter = 0
            }

            if (key.name === 'f' && key.ctrl) {
                content = format(content, {
                    parser: 'babel-ts'
                })
                fixCursorOverflow(content)
            }

            if (key.name === 'up') {
                cursorUp(content)
                updateCursor()
                return;
            }

            if (key.name === 'left') {
                cursorLeft()
                updateCursor()
                return;
            }

            if (key.name === 'right') {
                cursorRight(content)
                updateCursor()
                return;
            }

            if (key.name === 'down') {
                cursorDown(content)
                updateCursor()
                return;
            }

            if (key.name === 'return') {

                const lines = content.split(newLineSequence);
                const currentPositionInContent = lines.filter((_, idx) => idx < getCursorYWithOffset()).reduce((len, str) => len + str.length + newLineSequence.length, 0) + getCursorXWithOffset()

                content = content.substring(0, currentPositionInContent) + newLineSequence + content.substring(currentPositionInContent);

                cursorPos.y++
                cursorPos.x = cursorLeftOffset
                // return
            }

            if (key.name === 'backspace') {

                const lines = content.split(newLineSequence);


                const currentPositionInContent = lines.filter((_, idx) => idx < getCursorYWithOffset()).reduce((len, str) => len + str.length + newLineSequence.length, 0) + getCursorXWithOffset()

                const lastChar = content.charCodeAt(currentPositionInContent - 1)

                let isNewLineChar = lastChar === 10

                if (isNewLineChar) {
                    log('line start')
                    cursorPrevLineEnd(content)
                    content = content.substring(0, currentPositionInContent - 1) + content.substring(currentPositionInContent);
                }

                else {
                    log('no line start')

                    cursorLeft()
                    content = content.substring(0, currentPositionInContent - 1) + content.substring(currentPositionInContent);
                }
            }
            log('char', char)
            log('key.name', key.name)
            if (!key.ctrl && char !== undefined && key.name !== 'backspace' && key.name !== 'return') {
                if (key.name === 'tab') {
                    log('adding tab')
                    char = `  `
                }
                const lines = content.split(newLineSequence);
                const line = lines[getCursorYWithOffset()]
                const newLineChars = content.length === 0 ? char : line.substr(0, getCursorXWithOffset()) + char + line.substr(getCursorXWithOffset())
                lines[getCursorYWithOffset()] = newLineChars
                content = lines.join(newLineSequence)
                cursorRight(content, char.length)
            }

            print()
        })

        var rl = readline.createInterface({
            input: process.stdin,
            output: null,
            terminal: true,
            prompt: ''
        });

        cursorDown(content, Infinity)
        cursorRight(content, Infinity)
        print()
    })
}