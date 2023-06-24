process.env.NODE_ENV = 'test'

global.performance = {
  now: jest.fn().mockReturnValue(1),
} as unknown as Performance

global.console = {
  ...console,
  warn: (...inputs) => {
    if (typeof inputs[0] === 'string' && inputs[0].includes('Browserslist')) {
      return
    } else {
      return console.log('console.warn', ...inputs)
    }
  },
}
