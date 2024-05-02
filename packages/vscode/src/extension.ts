import * as vscode from 'vscode'
import { SidebarProvider } from './SidebarProvider'
import { SearchResultsPanel } from './SearchResultsPanel'
import { SearchStateManager, SearchStateShape } from './SearchStateManager'
import { eventBusInstance } from './EventBus'
import { SearchManager } from './SearchManager'
import {
  parseQueries,
  typeScriptFamilyExtensionTester,
  pathToPosix,
  __internal,
} from '@codeque/core'
import { sanitizeFsPath } from './nodeUtils'
import path from 'path'
import { dedentPatched, fileTypeToParserMap } from './utils'
import { getFileTypeFromFileExtension } from './nodeUtils'
import { activateReporter, telemetryModuleFactory } from './telemetry'
import { UserStateManager } from './UserStateManager'
import { UserManager } from './UserManager'
import fetch from 'node-fetch'

let dispose = (() => undefined) as () => void

export function activate(context: vscode.ExtensionContext) {
  const { telemetryModule, nativeReporter } = activateReporter()

  if (nativeReporter) {
    context.subscriptions.push(nativeReporter)
  }

  const { extensionUri } = context

  const searchStateManager = new SearchStateManager(
    context.workspaceState,
    telemetryModule,
  )

  const userStateManager = new UserStateManager(context.globalState)

  const openSearchResults = () =>
    SearchResultsPanel.createOrShow(extensionUri, searchStateManager)

  const openSidebar = async () =>
    vscode.commands.executeCommand(
      'workbench.view.extension.codeque-sidebar-view',
    )
  eventBusInstance.addListener('show-results-panel', openSearchResults)

  eventBusInstance.addListener('results-panel-visibility', (isVisible) => {
    if (isVisible) {
      openSidebar()
    }
  })

  const sidebarProvider = new SidebarProvider(extensionUri, searchStateManager)

  const searchManager = new SearchManager(
    searchStateManager,
    userStateManager,
    telemetryModule,
    sanitizeFsPath(extensionUri.fsPath),
  )

  const userManager = new UserManager(userStateManager, telemetryModule)

  dispose = () => {
    searchManager.dispose()
    userManager.dispose()
  }

  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
  )
  item.text = '🔍 Open Search'
  item.command = 'codeque.searchWithOptionalQuerySelectionFromEditor'
  item.show()

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'codeque-sidebar',
      sidebarProvider,
    ),
  )

  const openSearchWithOptionalQueryFromEditorSelection = async (
    newSearchSettings?: Partial<SearchStateShape>,
  ) => {
    const { activeTextEditor } = vscode.window

    let selectedCode: string | null = ''
    let selectedCodeFileExtension: string | null = null

    const state = searchStateManager.getState()

    if (activeTextEditor) {
      selectedCode = activeTextEditor.document.getText(
        activeTextEditor.selection,
      )

      const extensionMatch =
        activeTextEditor.document.fileName.match(/\.(\w)+$/g)

      if (extensionMatch?.[0] !== undefined) {
        selectedCodeFileExtension = extensionMatch[0]
      }
    } else {
      selectedCode = state.webviewTextSelection
    }

    const newQuery =
      selectedCode && /^\s/.test(selectedCode)
        ? dedentPatched(selectedCode)
        : selectedCode

    if (newQuery) {
      const fileType = getFileTypeFromFileExtension(selectedCodeFileExtension)

      let newMode = fileType !== 'all' ? state.mode : 'text'

      // For text mode we can always parse
      let canParseCodeForFileType = newMode === 'text'

      if (newMode !== 'text') {
        try {
          const parser = fileTypeToParserMap[fileType]

          const [_, parseOk] = parseQueries(
            [newQuery],
            false,
            __internal.parserSettingsMap[parser](),
          )
          canParseCodeForFileType = parseOk
        } catch (e) {
          canParseCodeForFileType = false

          console.error(
            'Error while parsing query for search from selection',
            e,
          )
        }
      }

      // If cannot parse the code with parser appropriate for the extension, fallback to text mode
      if (!canParseCodeForFileType) {
        newMode = 'text'
      }

      searchStateManager.setState({
        query: newQuery,
        mode: newMode,
        fileType: fileType,
      })
    }

    if (newSearchSettings) {
      searchStateManager.setState(newSearchSettings)
    }

    SearchResultsPanel.createOrShow(extensionUri, searchStateManager)

    await openSidebar()

    if (newQuery) {
      eventBusInstance.dispatch('open-search-from-selection')
      eventBusInstance.dispatch('set-query-on-ui', newQuery)
    }

    if (newQuery || newSearchSettings) {
      eventBusInstance.dispatch('start-search')
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'codeque.searchWithOptionalQuerySelectionFromEditor',
      async (data) => {
        openSearchWithOptionalQueryFromEditorSelection()
      },
    ),
    vscode.commands.registerCommand(
      'codeque.searchByEntryPoint',
      async (data) => {
        const searchPath = sanitizeFsPath(data.fsPath)
        const searchRoots = searchManager.getRoots()

        if (!searchRoots) {
          vscode.window.showErrorMessage(
            'Search error: Could not determine search root.',
          )

          return
        }

        const searchRoot =
          searchManager.matchRoot(searchRoots, searchPath)?.path ?? ''

        const rootToFindRelative =
          searchManager.getRootForFileListFilters(searchRoot)

        const relativePath = path.relative(rootToFindRelative, searchPath)

        const { ext } = path.parse(relativePath)

        if (!typeScriptFamilyExtensionTester.test(ext)) {
          vscode.window.showErrorMessage(
            'Search error: Unsupported entry point file extension: ' + ext,
          )

          return
        }

        await openSearchWithOptionalQueryFromEditorSelection({
          entryPoint: relativePath,
        })
      },
    ),
    vscode.commands.registerCommand('codeque.searchInFolder', async (data) => {
      const searchPath = sanitizeFsPath(data.fsPath)
      const searchRoots = searchManager.getRoots()

      if (!searchRoots) {
        vscode.window.showErrorMessage(
          'Search error: Could not determine search root.',
        )

        return
      }

      const searchRoot =
        searchManager.matchRoot(searchRoots, searchPath)?.path ?? ''

      const rootToFindRelative =
        searchManager.getRootForFileListFilters(searchRoot)

      const relativePath = path.relative(rootToFindRelative, searchPath)

      await openSearchWithOptionalQueryFromEditorSelection({
        include: [`${pathToPosix(relativePath)}/**`],
      })
    }),
  )

  const openLicensePurchaseWebsite = () => {
    vscode.env.openExternal(
      vscode.Uri.parse(
        'https://vscodesearch.com?utm_source=vscode_getLicenseCmd',
      ),
    )
  }

  const activateProLicense = async () => {
    try {
      telemetryModule.reportActivateLicenseCmd()

      const licenseKey = await vscode.window.showInputBox({
        title: 'License key (Get it on https://vscodesearch.com)',
        placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      })

      if (!licenseKey) {
        const result = await vscode.window.showErrorMessage(
          'Please provide license key to activate CodeQue Pro.',
          {},
          'Get license key',
        )

        const clickedGetLicense = result === 'Get license key'

        if (clickedGetLicense) {
          openLicensePurchaseWebsite()
        }

        telemetryModule.reportLicenseActivationError(
          `Missing license key ${
            clickedGetLicense ? ' - Clicked to get license' : ''
          }`,
        )

        return
      }

      const licenseActivationResult = (await fetch(
        'https://vscodesearch.com/api/vscode/activateLicense',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseKey,
            machineId: vscode.env.machineId,
          }),
        },
      ).then((res) => res.json())) as { success: boolean }

      if (!licenseActivationResult.success) {
        telemetryModule.reportLicenseActivationError('Invalid license key')

        return vscode.window.showErrorMessage('Invalid license key')
      }

      userStateManager.setState({ proLicenseKey: licenseKey })

      const fileBlob = await (
        await fetch(
          'https://vscodesearch.com/api/vscode/getLatestProInstalator',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              licenseKey,
              machineId: vscode.env.machineId,
            }),
          },
        )
      ).blob()

      const buffer = await fileBlob.arrayBuffer()

      const storagePath = context.storageUri?.fsPath

      const fileUri = vscode.Uri.file(`${storagePath}/extension.vsix`)

      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(buffer))

      await vscode.commands.executeCommand(
        'workbench.extensions.installExtension',
        fileUri,
      )

      telemetryModule.reportSuccessfulLicenseActivation()

      const successAction = await vscode.window.showInformationMessage(
        'CodeQue Pro installed correctly. Reload window to use it',
        {},
        'Reload window',
      )

      if (successAction === 'Reload window') {
        vscode.commands.executeCommand('workbench.action.reloadWindow')
      }
    } catch (e) {
      const error = e as Error
      const errorText = `${error.message} at ${error.stack}`

      telemetryModule.reportLicenseActivationError(`Unhandled: ${errorText}`)

      const errorAction = await vscode.window.showErrorMessage(
        `Unhandled license activation error: ${error}`,
        {},
        'Support via Github',
      )

      if (errorAction === 'Support via Github') {
        vscode.env.openExternal(
          vscode.Uri.parse('https://github.com/codeque-co/codeque/issues'),
        )
      }
    }
  }

  vscode.commands.registerCommand(
    'codeque.activateProLicense',
    activateProLicense,
  )

  vscode.commands.registerCommand('codeque.getProLicense', () => {
    telemetryModule.reportGetLicenseCmd()

    openLicensePurchaseWebsite()
  })

  /** Handle stub replace */

  eventBusInstance.addListener('pro-modal:closed', () => {
    telemetryModule.reportStubReplaceModalClose()
  })

  eventBusInstance.addListener('pro-modal:subscribe_clicked', () => {
    vscode.env.openExternal(
      vscode.Uri.parse(
        'https://jayu.dev/newsletter?utm_source=vscode_proModal',
      ),
    )

    telemetryModule.reportStubReplaceModalSubscribeClick()
  })

  eventBusInstance.addListener('pro-modal:twitter_handler_clicked', () => {
    vscode.env.openExternal(vscode.Uri.parse('https://twitter.com/jayu_dev'))

    telemetryModule.reportStubReplaceModalNameClick()
  })

  /** Handle webviews reload */

  context.subscriptions.push(
    // Thanks Ben
    vscode.commands.registerCommand('codeque.refresh', async () => {
      SearchResultsPanel.kill()
      SearchResultsPanel.createOrShow(extensionUri, searchStateManager)
      await vscode.commands.executeCommand('workbench.action.closeSidebar')

      await vscode.commands.executeCommand(
        'workbench.view.extension.codeque-sidebar-view',
      )

      // setTimeout(() => {
      //   vscode.commands.executeCommand(
      //     'workbench.action.webview.openDeveloperTools'
      //   )
      // }, 500)
    }),
  )
}

// this method is called when your extension is deactivated
export function deactivate() {
  dispose()
  void 0
}
