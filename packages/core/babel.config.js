module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
  plugins: [
    [
      'babel-plugin-root-import',
      {
        root: __dirname + '/src',
        rootPathSuffix: './',
        rootPathPrefix: '/',
      },
    ],
    './tools/babel.plugins.js',
  ],
  ignore: ['dist', 'node_modules', '__tests__'],
}
