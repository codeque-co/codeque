type WasmType = typeof import('../crate/pkg')

const notInitialized = () => {
  throw new Error('Wasm modules not initialized')
}

export const wasmFns = {
  trim_value: notInitialized
} as Pick<WasmType, 'trim_value'>

export const init = () => {
  return import("../crate/pkg").then(mod => {
    wasmFns.trim_value = mod.trim_value
  })
}