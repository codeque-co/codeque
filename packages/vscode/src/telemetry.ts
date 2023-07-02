import TelemetryReporter from '@vscode/extension-telemetry'

const applicationInsightsInstrumentationKey =
  '8f838c47-7173-4f6c-851a-b012d45d9ad8'

let reporter: TelemetryReporter | null = null

export const activateReporter = () => {
  reporter = new TelemetryReporter(applicationInsightsInstrumentationKey)

  return reporter
}
