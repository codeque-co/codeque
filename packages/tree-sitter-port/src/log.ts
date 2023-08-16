const info = (msg: string, prefix = '') => {
  process.stdout.write(prefix + 'ℹ️ ' + msg + '\n')
}

const success = (msg: string, prefix = '') => {
  process.stdout.write(prefix + '✅ ' + msg + '\n')
}

const error = (msg: string, prefix = '') => {
  process.stdout.write(prefix + '❌ ' + msg + '\n')
}

const createLogger = (prefix: string) => ({
  info: (msg: string) => {
    info(`${prefix}${msg}`, prefix)

    return createLogger('  ')
  },
  success: (msg: string) => {
    success(`${prefix}${msg}`, prefix)

    return createLogger('  ')
  },
  error: (msg: string) => {
    error(`${prefix}${msg}`, prefix)

    return createLogger('  ')
  },
})

export const logger = createLogger('')
