<p align="center">
  <a href="https://codeque.co/?utm_source=readme_eslint" title="Learn more about CodeQue" target="_blank">
    <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/media/logoShort.png?raw=true" width="150px" />
  </a>
  <br/>
  </p>
<p align="center">
  <a href="https://codeque.co/?utm_source=readme_eslint">Website</a>&nbsp;&nbsp;•&nbsp;&nbsp;  
  <a href="https://codeque.co/docs?utm_source=readme_eslint">Docs </a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/roadmap?utm_source=readme_eslint">Roadmap</a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/mission?utm_source=readme_eslint">Mission</a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/playground?utm_source=readme_eslint"><b>Playground</b></a>
</p>

<p align="center">Find and lint complex code patterns effortlessly</p>

___ 

# What is CodeQue?

CodeQue is semantic code search engine that understands the code syntax. 

It matches code structurally which makes it excellent for more complex queries.

Query language offers wildcards, partial matching and ignores code formatting. 

Structural code search is available for JavaScript, TypesScript, HTML, CSS, Python and more soon.

Text code search with handy wildcards is available for __every language__ and covers common regex search use cases.

<p align="center"><a href="https://codeque.co/playground?utm_source=readme_eslint"><b>Give it a try in 
 playground</b></a></p>

<p align="center"><i>Just paste code snippet to start searching, no installation needed!</i></p>

__Integrations__

CodeQue is available as:

- [VSCode extension](https://marketplace.visualstudio.com/items?itemName=CodeQue.codeque) for delightful code search and navigation experience.
- [ESLint integration](https://www.npmjs.com/package/@codeque/eslint-plugin) for creating custom linting rules in zero time.
- [CLI tool](https://www.npmjs.com/package/@codeque/cli) for searching code and more including headless environments.

<p align="center"><i>All CodeQue tools <b>work offline</b> hence code never leaves your local environment.</i></p>

__Coming soon__

CodeQue will be soon available as:

- Duplicated code identification
- Batch code refactoring 
- Advanced ESLint rule creator 


<p align="center"><a href="https://jayu.dev/newsletter?utm_source=readme_eslint"><b>🔔 Get notified about updates 🔔 </b></a></p>


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

CodeQue supports all parsers officially supported by ESLint
- [Espree](https://github.com/eslint/espree)
- [Esprima](https://www.npmjs.com/package/esprima)
- [@babel/eslint-parser](https://www.npmjs.com/package/@babel/eslint-parser)
- [@typescript-eslint/parser](https://www.npmjs.com/package/@typescript-eslint/parser)

👉 Open GitHub issue to [request parser support](https://github.com/codeque-co/codeque/issues)

## Configuration

Add `@codeque` plugin to plugins list in your `.eslintrc`.

And then add a definition for one of the rules: 
- `@codeque/error`
- `@codeque/warning`

There are two rules, so you can configure them to report errors or warnings.

Each rule should be provided with a list of rule config objects with CodeQue queries.

Learn more about writing queries from [CodeQue docs](https://codeque.co/docs)

```json
{
  "plugins": ["@codeque"],
  "rules": {
    "@codeque/error": ["error", [
      {
        "query": "fetchData()",
        "mode": "exact",
        "message": "Using fetchData() without parameters causes app crash!",
      },
    ]],
    "@codeque/warning": ["warn", [
      {
        "query": "import $$$ from 'lodash';",
        "mode": "include",
        "message": "Prefer to import lodash functions from separate packages like 'lodash.debounce'",
      },
    ]]
  }
}
```

The above configuration
- rises an error when `fetchData()` function is called without parameters
- reports a warning when utility is imported from main `lodash` package

<p align="center">
<img src="https://github.com/codeque-co/codeque/blob/master/packages/eslint/readme-media/getting-started.gif?raw=true" />
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

## Rule examples

CodeQue is general purpose code search tool. The examples list could be endless. Here are some of them for you to get a glimpse of what's possible. Those are relatively simple, you will definitely  find some more complex during day to day work.

> Don't know how to write a query? [Open an issue on GitHub](https://github.com/codeque-co/codeque/issues) !

### All usages of `console` object

Searching for console logs, warnings, errors is quite simple use-case and can be achieved using traditional tools, but It's for you to warm up 😁

This rule warns about all places in the code that can output some (usually unwanted) logs.

<details>
<summary>Show configuration</summary>

```json
{
  "rules": {
    "@codeque/warning": ["warn", [
      {
        "query": "console.$$()",
        "mode": "include",
        "message": "Prefer to use 'Logger' util.",
      },
    ]]
  }
}
```

</details>

<p align="center">
<img src="https://github.com/codeque-co/codeque/blob/master/packages/eslint/readme-media/console-log.gif?raw=true" />
</p>

### Library specific issues

Third party code not always work as expected. Whenever you spot a problem, add custom eslint rule to spread that knowledge across your team.

The rule warns against using `disabled` property on `SomeLibComponent`, and suggest using not documented `isDisabled` prop instead.

<details>
<summary>Show configuration</summary>

```json
{
  "rules": {
    "@codeque/warning": ["warn", [
      {
        "query": "<SomeLibComponent disabled />",
        "mode": "include",
        "message": "'disabled' property does not work as expected. Use 'isDisabled' instead",
        "includeFiles": ["**/*.tsx"]
      },
    ]]
  }
}
```

</details>

<p align="center">
<img src="https://github.com/codeque-co/codeque/blob/master/packages/eslint/readme-media/disabled-prop.gif?raw=true" />
</p>

### Unstable hook reference

Some 3rd party hooks are not implemented correctly and return non-memoized variables.

In this rule we rise an error when `confirm` callback from `useAsyncDialog` is used as an item of `useCallback` dependency array.

This is interesting example that links together two statements in the same code block, that does not necessarily have to directly follow each other.

<details>
<summary>Show configuration</summary>

```json
{
  "rules": {
    "@codeque/error": ["error", [
      {
        "query": "const { confirm } = useAsyncDialog(); const $$ = useCallback($$$, [confirm]);",
        "mode": "include",
        "message": "'confirm' is known to be unstable. Using it in hook dependency array can cause render loop",
      },
    ]]
  }
}
```

</details>


<p align="center">
<img src="https://github.com/codeque-co/codeque/blob/master/packages/eslint/readme-media/unstable-hook.gif?raw=true" />
</p>

### React bad patterns

First rule restricts usage of object literal as a prop. Object literal could be extracted to variable in upper scope or memoized to avoid performance issues.

Second rule restricts places where a given array is mapped directly in JSX. It could be memoized to make the array reference stable and reduce re-renders.


<details>
<summary>Show configuration</summary>

```json
{
  "rules": {
    "@codeque/error": ["error", [
      {
        "query": "<$$ $$={{}} />",
        "mode": "include",
        "message": "Don't use object literal in JSX props",
        "includeFiles": ["**/*.tsx"]
      },
      {
        "query": "<$$ $$={$$$.map(() => ($$$))} />",
        "mode": "include",
        "message": "Don't use map directly in JSX, memoize map result instead",
        "includeFiles": ["**/*.tsx"]
      },
    ]]
  }
}
```

</details>


<p align="center">
<img src="https://github.com/codeque-co/codeque/blob/master/packages/eslint/readme-media/object-literals.gif?raw=true" />
</p>

## What about performance?

Usually rules works very fast unless they are too generic.

CodeQue performs shallow matching based on strings in query, so it can filter out most of the source files before AST comparison even starts.

Query that contains wildcards only, eg. `$$.$$()` will be looked for in every file, as query does not include any specific characters sequence.

However query `console.$$()` would match only on files that contains `console` string somewhere within it's contents. 

Remember to be as specific as possible and use file filtering options eg. to not run  JSX rules on `*.js` files.

CodeQue will run faster for more specific patterns that occurs rarely in the codebase. If pattern is very common, it would have to do more comparisons, hence would run longer.

### Debugging performance

You can check performance of your CodeQue ESLint rules by running

```sh
TIMING=ALL CODEQUE_DEBUG=true yarn YOUR_LINT_SCRIPT
```

All the tests below were run on Typescript codebase with ~4000 source files.

It's not a benchmark, it's an example to give a reference. Results were not averaged.

#### Linting specific code patterns

Linting code pattern specific to your code base is what CodeQue eslint integration is build for.

Rule from examples section that captures issue with unstable hook reference occurs rare in the codebase, but can prevent various important bugs.

```
const { confirm } = useAsyncDialog(); 
const $$ = useCallback($$$, [confirm]);
```

For 12 occurrences it runs only ~60ms

```sh
✖ 12 problems (0 errors, 12 warnings)

Rule             | Time (ms) | Relative
:----------------|----------:|--------:
@codeque/warning |    64.425 |   100.0%
```

You should strive to eliminate that pattern, so assuming you've fixed all places, the rule takes ~30ms

```sh
0 problems (0 errors, 0 warnings)

Rule             | Time (ms) | Relative
:----------------|----------:|--------:
@codeque/warning |    28.286 |   100.0%
```


And for new introduction of the pattern while you code, it will be captures in ~30ms 

```sh
✖ 1 problems (0 errors, 1 warning)

Rule             | Time (ms) | Relative
:----------------|----------:|--------:
@codeque/warning |    30.553 |   100.0%
```

It's not much comparing to the value it gives. 

Consider how much time it would take to implement such rule with standard approach. No one has budget for that and instead time will be spend on fixing bugs.

#### Capturing restricted imports

Here is the comparison of `no-restricted-imports` ESLint rule with CodeQue rule. 

Both restricts importing `useCallback` from `react`.

CodeQue query is using `include` mode.

```ts
import { useCallback } from 'react'
```

Execution takes similar amount of time for both approaches.

```sh
✖ 648 problems (0 errors, 648 warnings)

Rule                  | Time (ms) | Relative
:---------------------|----------:|--------:
@codeque/warning      |    38.700 |    56.1%
no-restricted-imports |    30.239 |    43.9%
```


#### Restricting console usage

The performance result of ESLint `no-console` rule comparing to CodeQue `console.$$()` query on TypeScript codebase with ~4000 source files.

CodeQue is 4 times slower for this use case, but it's still only ~80ms for ~4000 source files!

```sh
✖ 404 problems (0 errors, 404 warnings)

Rule             | Time (ms) | Relative
:----------------|----------:|--------:
@codeque/warning |    81.267 |    79.1%
no-console       |    21.482 |    20.9%
```


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