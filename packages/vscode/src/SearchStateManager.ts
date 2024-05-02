import type { Mode } from '@codeque/core'
import {
  CaseType,
  QueryType,
  ReplaceMode,
  SearchFileType,
  ReplaceType,
} from './types'
import * as vscode from 'vscode'
import { eventBusInstance } from './EventBus'
import { TelemetryModule } from './telemetry'

export type SearchStateShape = {
  queryType: QueryType
  fileType: SearchFileType
  mode: Mode
  replaceMode: ReplaceMode
  replaceType: ReplaceType
  caseType: CaseType
  query: string
  replacement: string
  include: string[]
  exclude: string[]
  searchIgnoredFiles: boolean
  searchNodeModules: boolean
  searchBigFiles: boolean
  entryPoint: string | null
  webviewTextSelection: string | null
  searchFinished: boolean
}

export class SearchStateManager {
  private readonly defaultState: SearchStateShape = {
    queryType: 'basic',
    fileType: 'js-ts-json',
    mode: 'include',
    replaceMode: 'text',
    replaceType: 'replace',
    caseType: 'insensitive',
    query: '',
    replacement: '',
    include: [],
    exclude: [],
    searchIgnoredFiles: false,
    searchNodeModules: false,
    searchBigFiles: false,
    entryPoint: null,
    webviewTextSelection: null,
    searchFinished: true,
  }

  private readonly stateKey = 'codeque-data'
  private workspaceState: vscode.ExtensionContext['workspaceState']
  private localState: SearchStateShape
  private telemetryReporter: TelemetryModule

  constructor(
    workspaceState: vscode.ExtensionContext['workspaceState'],
    telemetryReporter: TelemetryModule,
  ) {
    this.workspaceState = workspaceState
    this.telemetryReporter = telemetryReporter
    const savedState = this.workspaceState.get(this.stateKey) as string

    let savedStateParsed: Partial<SearchStateShape> = {}

    if (savedState !== undefined) {
      try {
        savedStateParsed = JSON.parse(savedState)
      } catch (e) {
        console.error('saved state parse error', e)
        void 0
      }
    }

    const queryOverride: Partial<SearchStateShape> = {}

    if (
      'searchFinished' in savedStateParsed &&
      !savedStateParsed.searchFinished
    ) {
      // Previous search did not finish, so perhaps it has performance issues.
      // We reset query to prevent lock in of extension
      queryOverride.query =
        '// Previous query was removed due to detected performance issue.'
    }

    this.localState = {
      ...this.defaultState,
      ...savedStateParsed,
      ...queryOverride,
    }
  }

  private undefinedToNull = (state: SearchStateShape) => {
    return Object.entries(state)
      .map(([key, value]) => [key, value ?? null] as const)
      .reduce((state, [key, value]) => {
        return {
          ...state,
          [key]: value,
        }
      }, {} as SearchStateShape)
  }

  private getStateDiff = (
    prevState: SearchStateShape,
    nextState: SearchStateShape,
  ): Partial<SearchStateShape> => {
    const diff = {} as SearchStateShape

    Object.entries(prevState).forEach(([_key, value]) => {
      const key = _key as keyof SearchStateShape

      if (JSON.stringify(value) !== JSON.stringify(nextState[key])) {
        const nextValue = nextState[key]
        //@ts-ignore
        diff[key] = nextValue
      }
    })

    return diff
  }

  private reportTelemetryForStubStateChange = (
    data: Partial<SearchStateShape>,
  ) => {
    if (data.replaceMode) {
      this.telemetryReporter.reportStubReplaceModeChange(data.replaceMode)
    }

    if (data.replaceType) {
      this.telemetryReporter.reportStubReplaceTypeChange(data.replaceType)
    }

    if (data.replacement) {
      this.telemetryReporter.reportStubReplacementChange()
    }
  }

  public setState = (data: Partial<SearchStateShape>) => {
    const oldState = { ...this.localState }
    const newState = this.undefinedToNull({
      ...oldState,
      ...data,
    })

    this.localState = newState

    eventBusInstance.dispatch(
      'search-settings-changed',
      this.getStateDiff(oldState, newState),
    )

    this.workspaceState.update(this.stateKey, JSON.stringify(newState))

    this.reportTelemetryForStubStateChange(data)
  }

  public getState = () => {
    return { ...this.localState }
  }
}
