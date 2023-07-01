import { createTelemetryInstance } from '../telemetry'

const isCodeQueRepo = process.cwd().match(/packages(\/|\\)eslint$/g) !== null

if (!isCodeQueRepo) {
  createTelemetryInstance().reportInstall()
}
