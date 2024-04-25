import { Mode } from '@codeque/core'
import TelemetryReporter from '@vscode/extension-telemetry'
import { CaseType } from './types'
import { SearchFileType } from './SearchStateManager'

const applicationInsightsInstrumentationKey =
  '8f838c47-7173-4f6c-851a-b012d45d9ad8'

export const activateReporter = (): {
  nativeReporter: TelemetryReporter | null
  telemetryModule: TelemetryModule
} => {
  if (process.env.NODE_ENV !== 'production') {
    return {
      nativeReporter: null,
      telemetryModule: {
        reportSearch: () => undefined,
        reportSearchError: () => undefined,
        reportBannerClose: () => undefined,
        reportBannerLinkClick: () => undefined,
        reportBannersLoad: () => undefined,
        reportGetLicenseCmd: () => undefined,
        reportActivateLicenseCmd: () => undefined,
        reportLicenseActivationError: () => undefined,
        reportSuccessfulLicenseActivation: () => undefined,
      },
    }
  }

  const nativeReporter = new TelemetryReporter(
    applicationInsightsInstrumentationKey,
  )

  return {
    nativeReporter,
    telemetryModule: telemetryModuleFactory(nativeReporter),
  }
}

export type TelemetryModule = {
  reportSearch: (data: {
    mode: Mode
    caseType: CaseType
    fileType: SearchFileType
    isWorkspace: 'true' | 'false'
    queryLength: number
    searchTime: number
    resultsCount: number
    errorsCount: number
    searchedFilesCount: number
    mainExt: string
  }) => void
  reportSearchError: (data: {
    mode: Mode
    caseType: CaseType
    fileType: SearchFileType
    isWorkspace: 'true' | 'false'
    queryLength: number
    searchTime: number
  }) => void
  reportBannersLoad: () => void
  reportBannerClose: (bannerId: string) => void
  reportBannerLinkClick: (bannerId: string) => void
  reportGetLicenseCmd: () => void
  reportActivateLicenseCmd: () => void
  reportSuccessfulLicenseActivation: () => void
  reportLicenseActivationError: (issue: string) => void
}

export const telemetryModuleFactory = (
  reporter: TelemetryReporter,
): TelemetryModule => {
  return {
    reportSearch: async (data) => {
      try {
        reporter.sendTelemetryEvent(
          'vscode:search_results',
          {
            mode: data.mode,
            caseType: data.caseType,
            fileType: data.fileType,
            isWorkspace: data.isWorkspace,
            mainExt: data.mainExt,
          },
          {
            queryLength: data.queryLength,
            searchTime: data.searchTime,
            resultsCount: data.resultsCount,
            errorsCount: data.errorsCount,
            searchedFilesCount: data.searchedFilesCount,
          },
        )
      } catch (e) {
        console.error('Send telemetry event error', e)
      }
    },
    reportBannersLoad: async () => {
      try {
        reporter.sendTelemetryEvent('vscode:banners_load', {}, {})
      } catch (e) {
        console.error('Send telemetry event error', e)
      }
    },
    reportBannerLinkClick: async (bannerId: string) => {
      try {
        reporter.sendTelemetryEvent('vscode:banner_link_click', {
          bannerId,
        })
      } catch (e) {
        console.error('Send telemetry event error', e)
      }
    },
    reportBannerClose: async (bannerId: string) => {
      try {
        reporter.sendTelemetryEvent('vscode:banner_close', {
          bannerId,
        })
      } catch (e) {
        console.error('Send telemetry event error', e)
      }
    },
    reportSearchError: (data) => {
      try {
        reporter.sendTelemetryErrorEvent(
          'vscode:search_error',
          {
            mode: data.mode,
            caseType: data.caseType,
            fileType: data.fileType,
            isWorkspace: data.isWorkspace,
          },
          {
            queryLength: data.queryLength,
            searchTime: data.searchTime,
          },
        )
      } catch (e) {
        console.error('Telemetry error event reporting error', e)
      }
    },
    reportActivateLicenseCmd() {
      try {
        reporter.sendTelemetryEvent('vscode:activate_license_cmd', {})
      } catch (e) {
        console.error('Send telemetry event error', e)
      }
    },
    reportGetLicenseCmd() {
      try {
        reporter.sendTelemetryEvent('vscode:get_license_cmd', {})
      } catch (e) {
        console.error('Send telemetry event error', e)
      }
    },
    reportSuccessfulLicenseActivation() {
      try {
        reporter.sendTelemetryEvent('vscode:license_activation_success', {})
      } catch (e) {
        console.error('Send telemetry event error', e)
      }
    },
    reportLicenseActivationError(issue) {
      try {
        reporter.sendTelemetryErrorEvent('vscode:license_activation_error', {
          issue,
        })
      } catch (e) {
        console.error('Send telemetry event error', e)
      }
    },
  }
}
