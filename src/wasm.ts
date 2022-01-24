type WasmType = typeof import('../crate/pkg')

const notInitialized = () => {
  throw new Error('Wasm modules not initialized')
}

export const wasmFns = {
  trim_value: notInitialized
} as Pick<WasmType, 'trim_value'>

export const init = () => {
  return import("../crate/pkg").then(mod => {
    mod.authorize('eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJjcmVhdGVkQXQiOjE2NDMwNjI3MzM4NTcsInR5cGUiOiJCQVNJQyIsInNpZ24iOiJkMGRiNDgwOTgwZjcyMWJjM2I0MTM0ZTMxZDE2NzZkZjQxZmNhNTU3YmNlNjhlZjRmOTRmOGMyMzgwODBlMmJlIn0=')
    wasmFns.trim_value = mod.trim_value
  })
}