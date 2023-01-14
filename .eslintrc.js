module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'node', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:node/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'error',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-process-exit': 'off',
    'node/shebang': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'padding-line-between-statements': [
      'warn',
      {
        blankLine: 'always',
        prev: 'block-like',
        next: '*',
      }, // padding after code block
      {
        blankLine: 'always',
        prev: '*',
        next: 'return',
      }, // padding before return
      {
        blankLine: 'always',
        prev: '*',
        next: 'if',
      }, // padding before if statement
      {
        blankLine: 'always',
        prev: '*',
        next: 'for',
      }, // padding before for loop
      {
        blankLine: 'always',
        prev: '*',
        next: 'function',
      }, // padding before function
      {
        blankLine: 'always',
        prev: '*',
        next: 'multiline-expression',
      }, // padding before multiline-expression
      {
        blankLine: 'always',
        prev: 'multiline-expression',
        next: '*',
      }, // padding after multiline-expression
    ],
  },
}
