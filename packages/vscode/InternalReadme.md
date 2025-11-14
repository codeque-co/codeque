## Development

Make sure to build core package first `yarn workspace @codeque/core build`

Run `yarn watch:extension` and `yarn watch:webviews`

Open Vscode and run `Run extension` configuration in debugger

While in VSCode with extension host run `> Reload Extension` to refresh webview bundles

To refresh extension backed re-run debugger configuration.

## Testing production build locally
Make sure to build core package first `yarn workspace @codeque/core build`

Then change version in package.json to include `-local` suffix, eg. `0.35.1-local`.

Otherwise vscode will confuse locally installed version and you won't be able to download published version with the same version code, unless you uninstall local version manually

Package the extension into vsix file `cd packages/vscode && vsce package`

Command runs checks, run webpack build and package extension into `vsix` (kind of archive file)

You will get file `codeque-<version>.vsix`

The install extension from command pallette in vscode `cmd+p` -> `install from VSIX` -> select generated file -> Hit "Restart Extensions" button

## Publish to official Visual Studio Code Marketplace

Bump version manually in package.json

And just run 

`vsce publish -p <PAT>`

`vsce` will automatically run pre-publish hooks from script `vscode:prepublish` to run checks and build package

You might be asked to [get new PAT](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token)

## Publish to Open VSX registry

Same procedure as above, but run

`ovsx publish -p <PAT>`
