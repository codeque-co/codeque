type WasmType = typeof import('../crate/pkg')

const notInitialized = () => {
  throw new Error('Wasm modules not initialized')
}

export const wasmFns = {
  trim_value: notInitialized
} as Pick<WasmType, 'trim_value'>

export const init = () => {
  return import('../crate/pkg').then((mod) => {
    const licenseOk = mod.authorize(
      'eyJjcmVhdGVkX2F0IjoxNjQzNDc0NDc2NzEzLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJsaWNlbnNlX3R5cGUiOiJCQVNJQyIsInNpZ24iOiIxZGRkNDE0ZTFlNzI3ZWNmZDY1NDQzNTUyNjJlNzQ5NjEyZTdlYTgwZjYxMTM0NWMyYzcyOWEzZmVjZWM2NDZhIn0='
    )
    wasmFns.trim_value = mod.trim_value
  })
}
