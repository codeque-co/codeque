import type { Mode } from '@codeque/core'
import { CaseType } from 'types'
import * as vscode from 'vscode'
import { eventBusInstance } from './EventBus'

export type StateShape = {
  mode: Mode
  caseType: CaseType
  query: string
  include: string[]
  exclude: string[]
  searchIgnoredFiles: boolean
  searchNodeModules: boolean
  entryPoint: string | null
  webviewTextSelection: string | null
}

export class StateManager {
  private readonly defaultState: StateShape = {
    mode: 'include',
    caseType: 'insensitive',
    query: '',
    include: [],
    exclude: [],
    searchIgnoredFiles: false,
    searchNodeModules: false,
    entryPoint: null,
    webviewTextSelection: null,
  }

  private readonly stateKey = 'codeque-data'
  private workspaceState: vscode.ExtensionContext['workspaceState']
  private localState: StateShape

  constructor(workspaceState: vscode.ExtensionContext['workspaceState']) {
    this.workspaceState = workspaceState

    const savedState = this.workspaceState.get(this.stateKey) as string

    let savedStateParsed: Partial<StateShape> = {}
    try {
      savedStateParsed = JSON.parse(savedState)
    } catch (e) {
      console.log('saved state parse error', e)
      void 0
    }

    this.localState = {
      ...this.defaultState,
      ...savedStateParsed,
    }

    console.log('restored state', this.localState)
  }

  public setState = (data: Partial<StateShape>) => {
    const newState = {
      ...this.localState,
      ...data,
    }
    this.localState = newState

    // this.subscribeHandlers.forEach((handler) => handler(newState))
    eventBusInstance.dispatch('settings-changed', newState)

    console.log('persisting state', newState)
    this.workspaceState.update(this.stateKey, JSON.stringify(newState))
  }

  public getState = () => {
    return { ...this.localState }
  }
}
