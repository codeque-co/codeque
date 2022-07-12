const path = require('path')
const webpack = require('webpack')
module.exports = {
  target: 'web',
  mode: 'none',
  entry: {
    sidebar: './src/webviews/Sidebar/index.tsx',
    searchResultsPanel: './src/webviews/SearchResultsPanel/index.tsx'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    path: path.resolve(__dirname, 'dist-webviews'),
    filename: '[name].js'
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ]
}
