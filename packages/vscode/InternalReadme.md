## Development

Run `yarn watch:extension` and `yarn watch:webviews`

Open Vscode and run `Run extension` configuration in debugger

While in VSCode with extension host run `> Reload Extension` to refresh webview bundles

To refresh extension backed re-run debugger configuration.

## Publish to official Visual Studio Code Marketplace

Bump version manually in package.json

And just run 

`vsce publish`

`vsce` will automatically run pre-publish hooks from script `vscode:prepublish` to run checks and build package

You might be asked to [get new PAT](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token)

## Publish to Open VSX registry

Same procedure as above, but run

`ovsx publish`
