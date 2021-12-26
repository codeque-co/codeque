const path = require('path');
const pgk = require('./package.json')
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (_, { mode }) => {
  const isStandaloneBuild = process.env.STANDALONE === 'true'
  const isDev = mode === 'development'

  process.env.BABEL_ENV = mode // used by custom babel plugin

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
    externals: ['./crate/pkg/index.js'].concat(isStandaloneBuild ? [] : Object.keys(pgk.dependencies).filter((dep) => {
      const depPkg = require(`./node_modules/${dep}/package.json`)
      return depPkg.type !== 'module'
    })).reduce((map, dep) => ({
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
    plugins: [
      new WasmPackPlugin({
        crateDirectory: path.resolve(__dirname, 'crate'),
        extraArgs: '--target nodejs --mode normal',
        outDir: path.resolve(__dirname, 'crate', "pkg"),
      }),
      new CopyPlugin({
        patterns: [
          { from: "./crate/pkg/index_bg.wasm", to: "./index_bg.wasm" },
        ],
      })
    ],
    experiments: {
      syncWebAssembly: true,
    },
  };
}
