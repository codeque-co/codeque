//@ts-check

'use strict'

const path = require('path')

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'

  return {
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

    entry: {
      extension: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
      ...(isProduction
        ? {
          searchWorker: '../core/src/searchWorker.ts',
        }
        : {}),
    },
    output: {
      // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    },
    externals: {
      vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
      // modules added here also need to be added in the .vscodeignore file
      ...(isProduction
        ? {}
        : {
          '@codeque/core': 'commonjs @codeque/core',
        }),
    },
    resolve: {
      // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
      extensions: ['.ts', '.js', '.tsx', '.jsx'],
      alias: {
        // Avoid trying to bundle typescript-eslint/parser which is used by core, but not vscode
        '@typescript-eslint': false,
        espree: false,
        esprima: false,
        '@babel/eslint-parser': false,
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
            },
          ],
        },
      ],
    },
    devtool: isProduction ? false : 'nosources-source-map',
    infrastructureLogging: {
      level: 'log', // enables logging required for problem matchers
    },
  }
}
