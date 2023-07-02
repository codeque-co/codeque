import { machineIdSync } from 'node-machine-id'
import fs from 'fs'
import { createHash } from 'crypto'
import { defaultClient, setup, dispose } from 'applicationinsights'
//@ts-ignore
import isCI from 'is-ci'

type TelemetryModule = {
  reportConfig: (param: {
    ruleType: 'error' | 'warning'
    queriesCount: number
    mode_include: boolean
    mode_exact: boolean
    mode_include_w_order: boolean
    fileFilters_include: boolean
    fileFilters_exclude: boolean
  }) => void
  reportInstall: () => void
}

const disabledTelemetryInstance: TelemetryModule = {
  reportConfig: () => undefined,
  reportInstall: () => undefined,
}

function hash(guid: string): string {
  return createHash('sha256').update(guid).digest('hex')
}

const getProjectId = () => {
  const path = process.cwd() + '/package.json'

  try {
    const packageJSON = fs.readFileSync(path).toString()

    const parsedPackageJSON = JSON.parse(packageJSON)

    return hash(parsedPackageJSON.name)
  } catch (e) {
    return null
  }
}

export const telemetryDisabled =
  process.env.CQ_ESLINT_TELEMETRY_DISABLE === 'true' ||
  process.env.NODE_ENV === 'test'

export const createTelemetryInstance = (): TelemetryModule => {
  if (telemetryDisabled) {
    return disabledTelemetryInstance
  }

  setup(
    'InstrumentationKey=8f838c47-7173-4f6c-851a-b012d45d9ad8;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/',
  )
    .setAutoDependencyCorrelation(false)
    .setAutoCollectRequests(false)
    .setAutoCollectPerformance(false, false)
    .setAutoCollectExceptions(false)
    .setAutoCollectDependencies(false)
    .setAutoCollectConsole(false, false)
    .setUseDiskRetryCaching(false)
    .setAutoCollectPreAggregatedMetrics(false)
    .setSendLiveMetrics(false)
    .setAutoCollectHeartbeat(false)
    .setAutoCollectIncomingRequestAzureFunctions(false)
    .setInternalLogging(false, false)
    .enableWebInstrumentation(false)

  const telemetryClient = defaultClient

  const machineId = machineIdSync()
  const projectId = getProjectId()
  const arch = process.arch
  const platform = process.platform
  const nodeVersion = process.version

  const commonProps = {
    machineId,
    projectId,
    arch,
    platform,
    nodeVersion,
    isCI,
  }

  return {
    reportConfig: (params) => {
      try {
        telemetryClient.trackEvent({
          name: 'eslint:config',
          properties: {
            ...commonProps,
            ...params,
          },
        })

        telemetryClient.flush()
        dispose()
      } catch (e) {
        console.error('Failed to report telemetry for config')
      }
    },
    reportInstall: () => {
      try {
        telemetryClient.trackEvent({
          name: 'eslint:install',
          properties: commonProps,
        })

        telemetryClient.flush()
        dispose()
      } catch (e) {
        console.error('Failed to report telemetry for install')
      }
    },
  }
}
