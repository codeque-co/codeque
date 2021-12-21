const path = require('path');
const pgk = require('./package.json')

module.exports = (_, { mode }) => {
  const isDev = mode === 'development'
  return {
    watch: isDev,
    entry: {
      cli: path.resolve(__dirname, './src/cli.ts'),
      worker: path.resolve(__dirname, './src/searchWorker.ts'),
      ...(isDev ? {
        dev: path.resolve(__dirname, './src/dev.ts')
      } : {})
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          exclude: /node_modules|__tests__/,
          use: ['babel-loader']
        }
      ]
    },
    //Don't transpile & include modules except some ESM modules that does not work otherwise
    externals: Object.keys(pgk.dependencies).filter((dep) => {
      const depPkg = require(`./node_modules/${dep}/package.json`)
      return depPkg.type !== 'module'
    }).reduce((map, dep) => ({
      ...map,
      [dep]: `commonjs2 ${dep}`
    })),
    externalsPresets: {
      node: true,
    },
    resolve: {
      extensions: ['*', '.js', '.ts']
    },
    target: 'node',
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: '[name].js',
    },
  };
}
