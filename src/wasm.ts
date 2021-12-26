type WasmType = typeof import('../crate/pkg')

const notInitialized = () => {
  throw new Error('Wasm modules not initialized')
}

export const wasmFns = {
  transform_value: notInitialized
} as Pick<WasmType, 'transform_value'>

export const init = () => {
  return import("../crate/pkg").then(mod => {
    wasmFns.transform_value = mod.transform_value
  })
}