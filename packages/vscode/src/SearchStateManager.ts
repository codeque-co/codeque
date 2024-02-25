import type { Mode } from '@codeque/core'
import * as vscode from 'vscode'
import { eventBusInstance } from './EventBus'

export type SearchFileType =
  | 'all'
  | 'js-ts-json'
  | 'html'
  | 'css'
  | 'python'
  | 'lua'
export type CaseType = 'sensitive' | 'insensitive'

export type SearchStateShape = {
  fileType: SearchFileType
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
  searchFinished: boolean
}

export class SearchStateManager {
  private readonly defaultState: SearchStateShape = {
    fileType: 'js-ts-json',
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
    searchFinished: true,
  }

  private readonly stateKey = 'codeque-data'
  private workspaceState: vscode.ExtensionContext['workspaceState']
  private localState: SearchStateShape

  constructor(workspaceState: vscode.ExtensionContext['workspaceState']) {
    this.workspaceState = workspaceState

    const savedState = this.workspaceState.get(this.stateKey) as string

    let savedStateParsed: Partial<SearchStateShape> = {}
    try {
      savedStateParsed = JSON.parse(savedState)
    } catch (e) {
      console.error('saved state parse error', e)
      void 0
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
  }

  public getState = () => {
    return { ...this.localState }
  }
}
