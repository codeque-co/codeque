const path = require('path')
const pgk = require('./package.json')

module.exports = (_, { mode }) => {
  const isStandaloneBuild = process.env.STANDALONE === 'true'
  const isDev = mode === 'development'

  process.env.BABEL_ENV = mode // used by custom babel plugin

  return {
    watch: isDev,
    entry: {
      cli: path.resolve(__dirname, './src/cli.ts'),
      worker: path.resolve(__dirname, './src/searchWorker.ts'),
      searchInStrings: path.resolve(__dirname, './src/searchInStrings.ts'),
      ...(isDev
        ? {
            dev: path.resolve(__dirname, './src/dev.ts'),
            devGetFiles: path.resolve(__dirname, './src/devGetFiles.ts')
          }
        : {})
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          exclude: /node_modules|__tests__/,
          use: ['babel-loader']
        },
        {
          test: /dpdm(.)*\.m?js/,
          resolve: {
            fullySpecified: false
          }
        }
      ]
    },
    //Don't transpile & include modules except some ESM modules that does not work otherwise
    externals: []
      .concat(isStandaloneBuild ? [] : Object.keys(pgk.dependencies))
      .reduce((map, dep) => ({
        ...map,
        [dep]: `commonjs2 ${dep}`
      })),
    externalsPresets: {
      node: true
    },
    resolve: {
      extensions: ['*', '.js', '.ts']
    },
    target: 'node',
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: '[name].js',
      library: {
        name: 'codeque',
        type: 'umd'
      }
    },
    plugins: []
  }
}
