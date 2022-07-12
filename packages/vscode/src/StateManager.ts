import type { Mode } from '@codeque/core'
import * as vscode from 'vscode'

export type StateShape = {
  mode: Mode
  caseInsensitive: boolean
  query: string
}

type SubscribeHandler = (data: StateShape) => void

export class StateManager {
  private readonly defaultState: StateShape = {
    mode: 'include',
    caseInsensitive: false,
    query: ''
  }

  private readonly stateKey = 'codeque-data'
  private workspaceState: vscode.ExtensionContext['workspaceState']
  private localState: StateShape
  private subscribeHandlers: Array<SubscribeHandler> = []

  constructor(workspaceState: vscode.ExtensionContext['workspaceState']) {
    this.workspaceState = workspaceState

    const savedState = this.workspaceState.get(this.stateKey) as string

    let savedStateParsed: Partial<StateShape> = {}
    try {
      savedStateParsed = JSON.parse(savedState)
    } catch (e) {
      void 0
    }

    this.localState = {
      ...this.defaultState,
      ...savedStateParsed
    }
  }

  public setState(data: Partial<StateShape>) {
    const newState = {
      ...this.localState,
      ...data
    }
    this.localState = newState

    this.subscribeHandlers.forEach((handler) => handler(newState))

    this.workspaceState.update(this.stateKey, JSON.stringify(newState))
  }

  public getState() {
    return this.localState
  }

  public subscribe(handler: SubscribeHandler) {
    this.subscribeHandlers.push(handler)

    return this.createUnsubscribe(handler)
  }

  private createUnsubscribe(handler: SubscribeHandler) {
    return () => {
      this.subscribeHandlers = this.subscribeHandlers.filter(
        (savedHandler) => savedHandler !== handler
      )
    }
  }
}
