const path = require('path')
const webpack = require('webpack')

// TODO add vendors output to not include react and chakra twice
module.exports = {
  target: 'web',
  mode: 'none',
  entry: {
    sidebar: './src/webviews/Sidebar/index.tsx',
    searchResultsPanel: './src/webviews/SearchResultsPanel/index.tsx',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist-webviews'),
    filename: '[name].js',
  },
  devtool: false,
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    }),
  ],
}
