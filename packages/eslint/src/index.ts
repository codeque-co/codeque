import { createLintCode } from './lintCode'

export const rules = {
  error: createLintCode('problem'),
  warning: createLintCode('suggestion'),
}

module.exports = {
  rules,
}
