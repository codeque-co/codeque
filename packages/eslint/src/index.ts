import { createLintCode } from './lintCode'

const rules = {
  error: createLintCode('problem'),
  warning: createLintCode('suggestion'),
}

module.exports = {
  rules,
}
