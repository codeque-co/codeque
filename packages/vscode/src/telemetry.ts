import { Mode } from '@codeque/core'
import TelemetryReporter from '@vscode/extension-telemetry'
import { CaseType, SearchFileType } from './types'

const applicationInsightsInstrumentationKey =
  '8f838c47-7173-4f6c-851a-b012d45d9ad8'

export const activateReporter = (): {
  nativeReporter: TelemetryReporter | null
  telemetryModule: TelemetryModule
} => {
  if (process.env.NODE_ENV !== 'production') {
    const logTelemetryInDev = (fnName: string, args: Array<any>) => {
      //eslint-disable-next-line
      console.log('TelemetryDev', fnName, ...args)
    }

    return {
      nativeReporter: null,
      telemetryModule: {
        reportSearch: (...args) => logTelemetryInDev('reportSearch', args),
        reportSearchError: (...args) =>
          logTelemetryInDev('reportSearchError', args),
        reportBannerClose: (...args) =>
          logTelemetryInDev('reportBannerClose', args),
        reportBannerLinkClick: (...args) =>
          logTelemetryInDev('reportBannerLinkClick', args),
        reportBannersLoad: (...args) =>
          logTelemetryInDev('reportBannersLoad', args),
        reportGetLicenseCmd: (...args) =>
          logTelemetryInDev('reportGetLicenseCmd', args),
        reportActivateLicenseCmd: (...args) =>
          logTelemetryInDev('reportActivateLicenseCmd', args),
        reportLicenseActivationError: (...args) =>
          logTelemetryInDev('reportLicenseActivationError', args),
        reportSuccessfulLicenseActivation: (...args) =>
          logTelemetryInDev('reportSuccessfulLicenseActivation', args),
        reportStubReplacementChange: (...args) =>
          logTelemetryInDev('reportStubReplacementChange', args),
        reportStubReplaceModeChange: (...args) =>
          logTelemetryInDev('reportStubReplaceModeChange', args),
        reportStubReplaceTypeChange: (...args) =>
          logTelemetryInDev('reportStubReplaceTypeChange', args),
        reportStubReplaceClick: (...args) =>
          logTelemetryInDev('reportStubReplaceClick', args),
        reportStubReplaceModalClose: (...args) =>
          logTelemetryInDev('reportStubReplaceModalClose', args),
        reportStubReplaceModalSubscribeClick: (...args) =>
          logTelemetryInDev('reportStubReplaceModalSubscribeClick', args),
        reportStubReplaceModalNameClick: (...args) =>
          logTelemetryInDev('reportStubReplaceModalNameClick', args),
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
  reportStubReplacementChange: () => void
  reportStubReplaceModeChange: (mode: string) => void
  reportStubReplaceTypeChange: (type: string) => void
  reportStubReplaceClick: () => void
  reportStubReplaceModalClose: () => void
  reportStubReplaceModalSubscribeClick: () => void
  reportStubReplaceModalNameClick: () => void
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
    reportStubReplacementChange: () => {
      try {
        reporter.sendTelemetryEvent('vscode:stub_replacement_change', {})
      } catch (e) {
        console.error('Send telemetry event error, e')
      }
    },
    reportStubReplaceModeChange: (mode: string) => {
      try {
        reporter.sendTelemetryEvent('vscode:stub_replace_mode_change', {
          mode,
        })
      } catch (e) {
        console.error('Send telemetry event error, e')
      }
    },
    reportStubReplaceTypeChange: (type: string) => {
      try {
        reporter.sendTelemetryEvent('vscode:stub_replace_type_change', { type })
      } catch (e) {
        console.error('Send telemetry event error, e')
      }
    },
    reportStubReplaceClick: () => {
      try {
        reporter.sendTelemetryEvent('vscode:stub_replace_click', {})
      } catch (e) {
        console.error('Send telemetry event error, e')
      }
    },
    reportStubReplaceModalClose: () => {
      try {
        reporter.sendTelemetryEvent('vscode:stub_replace_modal_close', {})
      } catch (e) {
        console.error('Send telemetry event error, e')
      }
    },
    reportStubReplaceModalSubscribeClick: () => {
      try {
        reporter.sendTelemetryEvent(
          'vscode:stub_replace_modal_subscribe_click',
          {},
        )
      } catch (e) {
        console.error('Send telemetry event error, e')
      }
    },
    reportStubReplaceModalNameClick: () => {
      try {
        reporter.sendTelemetryEvent('vscode:stub_replace_modal_name_click', {})
      } catch (e) {
        console.error('Send telemetry event error, e')
      }
    },
  }
}
