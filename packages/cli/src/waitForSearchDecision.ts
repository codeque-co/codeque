import readline from 'readline'
import { print } from './utils'

export async function waitForSearchDecision() {
  print('🔍 Ctrl+s 👉 search again', '  🚪 Ctrl+c 👉 finish')

  return new Promise((resolve) => {
    const keypressListener = (
      char: string,
      key: { name: string; ctrl: boolean },
    ) => {
      if (key.name === 's' && key.ctrl) {
        rl.close()
        process.stdin.off('keypress', keypressListener)
        resolve(true)
      }

      if (key.name === 'c' && key.ctrl) {
        rl.close()
        process.stdin.off('keypress', keypressListener)
        resolve(false)
      }
    }

    process.stdin.on('keypress', keypressListener)

    const rl = readline.createInterface({
      input: process.stdin,
      output: undefined,
      terminal: true,
      prompt: '',
    })
  })
}
