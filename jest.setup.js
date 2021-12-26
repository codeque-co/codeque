const { init } = require('/wasm')

beforeAll(async () => {
  await init()
})
