# CodeQue

CodeQue is multiline search and replace tool for TypeScript and JavaScript!

It's pre-release, Readme will be updated later :)

For more information visit [codeque.co](http://codeque.co) website

Apart from all search features provided by CodeQue core, VScode extension offers a handy UI for managing search results.
Search results can be removed, collapsed or marked as done making it easy to iterate over long list of matches.

<img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/media/CodeQue-vscode.png?raw=true"/>

## Development

Run `yarn watch:extension` and `yarn watch:webviews`

Open Vscode and run `Run extension` configuration in debugger

While in VSCode with extension host run `> Reload Extension` to refresh webview bundles

To refresh extension backed re-run debugger configuration.

## Publish

Bump version manually in package.json

And just run 

`vsce publish`

`vsce` will automatically run pre-publish hooks from script `vscode:prepublish` to run checks and build package

You might be asked to [get new PAT](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token)