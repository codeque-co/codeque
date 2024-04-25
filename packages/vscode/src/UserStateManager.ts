import * as vscode from 'vscode'
import { eventBusInstance } from './EventBus'

export type UserStateShape = {
  closedBannerIds: string[]
  searchesWithResultsCount: number
  proLicenseKey: string | null
}

export class UserStateManager {
  private readonly defaultState: UserStateShape = {
    closedBannerIds: [],
    searchesWithResultsCount: 0,
    proLicenseKey: null,
  }

  private readonly stateKey = 'codeque-user-data'
  private globalState: vscode.ExtensionContext['globalState']
  private localState: UserStateShape

  constructor(globalState: vscode.ExtensionContext['globalState']) {
    this.globalState = globalState
    this.globalState.setKeysForSync([this.stateKey])

    const savedState = this.globalState.get(this.stateKey) as string | undefined

    let savedStateParsed: Partial<UserStateShape> = {}

    if (savedState !== undefined) {
      try {
        savedStateParsed = JSON.parse(savedState)
      } catch (e) {
        console.error('saved state parse error', e)
        void 0
      }
    }

    this.localState = {
      ...this.defaultState,
      ...savedStateParsed,
    }
  }

  private undefinedToNull = (state: UserStateShape) => {
    return Object.entries(state)
      .map(([key, value]) => [key, value ?? null] as const)
      .reduce((state, [key, value]) => {
        return {
          ...state,
          [key]: value,
        }
      }, {} as UserStateShape)
  }

  private getStateDiff = (
    prevState: UserStateShape,
    nextState: UserStateShape,
  ): Partial<UserStateShape> => {
    const diff = {} as UserStateShape

    Object.entries(prevState).forEach(([_key, value]) => {
      const key = _key as keyof UserStateShape

      if (JSON.stringify(value) !== JSON.stringify(nextState[key])) {
        const nextValue = nextState[key]
        //@ts-ignore
        diff[key] = nextValue
      }
    })

    return diff
  }

  public setState = (data: Partial<UserStateShape>) => {
    const oldState = { ...this.localState }
    const newState = this.undefinedToNull({
      ...oldState,
      ...data,
    })

    this.localState = newState

    eventBusInstance.dispatch(
      'user-settings-changed',
      this.getStateDiff(oldState, newState),
    )

    this.globalState.update(this.stateKey, JSON.stringify(newState))
  }

  public getState = () => {
    return { ...this.localState }
  }
}
