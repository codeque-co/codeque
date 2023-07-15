import { Mode } from '@codeque/core'
import TelemetryReporter from '@vscode/extension-telemetry'
import { CaseType } from './types'
import { SearchFileType } from './StateManager'
import fetch from 'node-fetch'

const applicationInsightsInstrumentationKey =
  '8f838c47-7173-4f6c-851a-b012d45d9ad8'

export const activateReporter = (): {
  nativeReporter: TelemetryReporter | null
  telemetryModule: TelemetryModule
} => {
  // TODO re-enable telemetry
  //if (process.env.NODE_ENV !== 'production') {
  return {
    nativeReporter: null,
    telemetryModule: {
      reportSearch: () => undefined,
      reportSearchError: () => undefined,
    },
  }
  //}

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
}

export const telemetryModuleFactory = (
  reporter: TelemetryReporter,
): TelemetryModule => {
  return {
    reportSearch: async (data) => {
      try {
        await fetch('https://codeque.co/api/reportSearch', {
          method: 'GET',
          headers: {
            token: '24590g3j8b-vq3ug42-j3tw',
          },
        })
      } catch (e) {
        console.error('Failed to report basic telemetry to Codeque')
      }

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
  }
}
