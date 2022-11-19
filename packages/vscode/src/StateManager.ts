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
  searchBigFiles: boolean
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
    searchBigFiles: false,
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
      console.error('saved state parse error', e)
      void 0
    }

    this.localState = {
      ...this.defaultState,
      ...savedStateParsed,
    }
  }

  private undefinedToNull = (state: StateShape) => {
    return Object.entries(state)
      .map(([key, value]) => [key, value ?? null] as const)
      .reduce((state, [key, value]) => {
        return {
          ...state,
          [key]: value,
        }
      }, {} as StateShape)
  }

  private getStateDiff = (
    prevState: StateShape,
    nextState: StateShape,
  ): Partial<StateShape> => {
    const diff = {} as StateShape

    Object.entries(prevState).forEach(([_key, value]) => {
      const key = _key as keyof StateShape

      if (JSON.stringify(value) !== JSON.stringify(nextState[key])) {
        const nextValue = nextState[key]
        //@ts-ignore
        diff[key] = nextValue
      }
    })

    return diff
  }

  public setState = (data: Partial<StateShape>) => {
    const oldState = { ...this.localState }
    const newState = this.undefinedToNull({
      ...oldState,
      ...data,
    })

    this.localState = newState

    eventBusInstance.dispatch(
      'settings-changed',
      this.getStateDiff(oldState, newState),
    )

    this.workspaceState.update(this.stateKey, JSON.stringify(newState))
  }

  public getState = () => {
    return { ...this.localState }
  }
}
