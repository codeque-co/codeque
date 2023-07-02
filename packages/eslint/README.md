<p align="center">
  <a href="https://codeque.co" title="Learn more about CodeQue" target="_blank">
    <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/media/logoShort.png?raw=true" width="200px" />
  </a>
  <br/>
  </p>
<p align="center">
  <a href="https://codeque.co">Website</a>&nbsp;&nbsp;•&nbsp;&nbsp;  
  <a href="https://codeque.co/docs">Docs </a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/roadmap">Roadmap</a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/mission">Mission</a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/playground"><b>Playground</b></a>
</p>

<p align="center">Streamline your workflow by finding and linting complex code patterns effortlessly.</p>

___ 

# What is CodeQue?

CodeQue is semantic code search engine that understands the code syntax. 

It matches code structurally which makes it excellent for more complex queries.

Query language offers wildcards, partial matching and ignores code formatting. 

Structural code search is available for JavaScript, TypesScript, HTML, CSS and more soon.

Text code search with handy wildcards is available for __every language__ and covers common regex search use cases.

<p align="center"><a href="https://codeque.co/playground"><b>Give it a try in 
 playground</b></a></p>

<p align="center"><i>Just paste code snippet to start searching, no installation needed!</i></p>

__Integrations__

CodeQue is available as:

- [VSCode extension](https://marketplace.visualstudio.com/items?itemName=CodeQue.codeque) for enhanced code search and navigation experience.
- [ESLint integration](https://www.npmjs.com/package/@codeque/eslint-plugin) for creating custom linting rules in zero time.
- [CLI tool](https://www.npmjs.com/package/@codeque/cli) for searching code and more including headless environments.

CodeQue will be soon available as:

- Duplicated code identification
- Batch code refactoring 
- Advanced ESLint rules creator 


<p align="center"><a href="https://jayu.dev/newsletter"><b>🔔 Get notified 🔔 </b></a></p>

<p align="center"><i>All CodeQue tools <b>operate offline</b> hence code never leaves your local environment.</i></p>

</br>

<!-- HERO END -->
  
<!-- ESLINT INTRO START -->
## ESLint integration 💅

Using CodeQue ESLint plugin you can create your own custom linting rules in zero time.

Custom ESLint rules can help execute on long-term refactors or prevent introducing codebase specific bugs or bad patterns.

Rules can replace your decision log and help standardizing coding conventions across the project or organization.

CodeQue ESLint integration is a no-brainier for any team willing to improve their codebase quality.

<!-- ESLINT INTRO END -->

## Installation

```sh
yarn add --dev @codeque/eslint-plugin
```

> `@codeque/eslint-plugin` is now in `beta` and only supports `@typescript-eslint/parser` parser. `@babel/eslint-parser` and `Esprima` will be supported soon.

> `@codeque/eslint-plugin` was tested with `ESLint` in versions `7.x` and `8.x`.

## Configuration

Add `@codeque` plugin to plugins list in your `.eslintrc`

```js
{
  plugins: ["@codeque"]
}
```

And add a definition for one of the rules: `@codeque/error` or `@codeque/warning`.

There are two rules, so you can configure them to report errors or warnings.

Each rule should be provided with a list of rule config objects with CodeQue queries.

Learn mode about writing queries from [CodeQue docs](https://codeque.co/docs)

```js
{
  rules: [
    "@codeque/error": ["error", [
      {
        "query": "throw new Error()",
        mode: "include",
        message: "Use only project defined error classes.",
      },
    ]],
    "@codeque/warning": ["warn", [
      {
        "query": "import $$$ from 'lodash';",
        mode: "include",
        message: "Prefer to import lodash functions from separate packages like 'lodash.debounce'",
      },
    ]]
  ]
}
```

<p align="center">
<img src="https://github.com/codeque-co/codeque/blob/master/packages/eslint/readme-media/error-example.png?raw=true" width="500px"/>
</p>
<p align="center">
<img src="https://github.com/codeque-co/codeque/blob/master/packages/eslint/readme-media/warning-example.png?raw=true"  width="500px" />
</p>

> If your config seems too big, feel free to extract your set of rules to a separate file. Change your `.eslintrc` to JS file and import rules from a separate file.

## Rule config object properties

Minimal rule config object should contain just `query` key

```js
({
  query: "someCode"
})
```

The default settings are:
- `mode` - `include`
- `message` - `Restricted code pattern`
- `caseInsensitive` - `true`
- `includeFiles` - `undefined` (do not filter files provided by ESLint)
- `excludeFiles` - `[]` (do not filter files provided by ESLint)

All configuration options

```ts
type RuleConfig = {
  query: string // Content of the query
  mode: 'exact' | 'include' | 'include-with-order' // CodeQue search mode
  message: string // Error message to display 
  caseInsensitive: boolean // Whether query should perform matches case insensitively
  includeFiles: string[] | undefined // list of glob patterns to indicate files against which given rule should be executed
  excludeFiles: string[] // list of glob patterns to indicate files against which given rule should not be executed
}
```

## Debugging performance

You can check performance of your CodeQue ESLint rules by running

```sh
TIMING=1 CODEQUE_DEBUG=true yarn YOUR_LINT_SCRIPT
```

> Use TIMING=all to list all ESLint rules.

## Telemetry

Plugin collects completely anonymous telemetry that helps me get insights about usage.

It's implemented using `applicationinsights` and you can easily opt-out.

Learn more about [telemetry](https://codeque.co/docs/telemetry#es-lint-plugin)

<!-- FOOTER START -->

## Support and feedback

Feel free to use [Github Issues](https://github.com/codeque-co/codeque/issues)
to
- ask for help with writing a query
- report a bug or doubt
- suggest feature or improvement