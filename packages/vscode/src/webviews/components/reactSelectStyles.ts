import { StylesConfig } from 'react-select'

const commonProps = {
  fontFamily: 'var(--vscode-font-family)',
  color: 'var(--vscode-input-foreground)',
  outlineColor: 'var(--vscode-input-border)',
  backgroundColor: 'var(--vscode-input-background)',
}

const defaultStylesFn = (provided: any) => ({
  ...provided,
  ...commonProps,
})

export const reactSelectStyles: StylesConfig = {
  container: defaultStylesFn,
  control: (provided) => ({
    ...provided,
    ...commonProps,
    borderWidth: 0,
  }),
  input: defaultStylesFn,
  menu: defaultStylesFn,
  menuList: defaultStylesFn,
  option: defaultStylesFn,
  multiValue: (provided) => ({
    ...provided,
    ...commonProps,
    backgroundColor: 'var(--vscode-editor-background)',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    ...commonProps,
    backgroundColor: 'var(--vscode-editor-background)',
  }),
}
