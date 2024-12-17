<a href="https://codeque.co/vscode-demo-sound.mp4?utm_source=readme_vscode" target="_blank" title="Click to watch demo video">
    <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/intro.gif?raw=true" />
</a>

<br>
      
<!-- HERO START -->

<p align="center">
  <a href="https://codeque.co/?utm_source=readme_vscode" title="Learn more about CodeQue" target="_blank">
    <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/media/logoShort.png?raw=true" width="150px" />
  </a>
  <br/>
  </p>
<p align="center">
  <a href="https://codeque.co/?utm_source=readme_vscode">Website</a>&nbsp;&nbsp;•&nbsp;&nbsp;  
  <a href="https://codeque.co/docs?utm_source=readme_vscode">Docs </a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/roadmap?utm_source=readme_vscode">Roadmap</a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/mission?utm_source=readme_vscode">Mission</a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/playground?utm_source=readme_vscode"><b>Playground</b></a>
</p>

<p align="center">Find and lint complex code patterns effortlessly</p>

---

# What is CodeQue?

CodeQue is semantic code search engine that understands the code syntax.

It matches code structurally which makes it excellent for more complex queries.

Query language offers wildcards, partial matching and ignores code formatting.

Structural code search is available for JavaScript, TypesScript, HTML, CSS, Python, Lua, C# and more soon.

Text code search with handy wildcards is available for **every language** and covers common regex search use cases.

<p align="center"><a href="https://codeque.co/playground?utm_source=readme_vscode"><b>Give it a try in 
 playground</b></a></p>

<p align="center"><i>Just paste code snippet to start searching, no installation needed!</i></p>

**Integrations**

CodeQue is available as:

- [VSCode extension](https://marketplace.visualstudio.com/items?itemName=CodeQue.codeque) for delightful code search and navigation experience.
- [ESLint integration](https://www.npmjs.com/package/@codeque/eslint-plugin) for creating custom linting rules in zero time.
- [CLI tool](https://www.npmjs.com/package/@codeque/cli) for searching code and more including headless environments.

<p align="center"><i>All CodeQue tools <b>work offline</b> hence code never leaves your local environment.</i></p>

**Coming soon**

CodeQue will be soon available as:

- Duplicated code identification
- Batch code refactoring
- Advanced ESLint rule creator

<p align="center"><a href="https://jayu.dev/newsletter?utm_source=readme_vscode"><b>🔔 Get notified about updates 🔔 </b></a></p>

</br>

<!-- HERO END -->

<!-- VSCODE INTRO START -->

## Visual Studio Code Extension 🔮

VScode extension aims to make your workflow more efficient.

It addresses the problems of standard search by providing multiline support and offers an easy way to add gaps or use wildcards in the query.

You don't need to have any Regex knowledge to query complex code patterns.

With CodeQue, you can easily navigate and modify your codebase, making your development process faster and more efficient.

It will help you with code refactoring, speed up project discovery, and make it easy to find duplicated or similar code patterns.

Advanced code search options and todo-like list of accurate search results will streamline your workflow.

</br>

<p align="center"><b>Watch extension in action in 1 minute (external link) 👇</b></p>

<a href="https://codeque.co/vscode-demo-sound.mp4?utm_source=readme_vscode" target="_blank" title="Click to watch demo video">
    <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/intro.gif?raw=true" />
</a>

</br>

<!-- VSCODE INTRO END -->

## About

One of the main strengths of CodeQue is its easy-to-use query language, but it also offers several additional features that make it a great support tool for your daily work.

**Features**

- [Query language](#query-language)
- [Search modes](#search-modes)
- [Searching by file imports](#searching-by-file-imports)
- [Todo-like results list](#todo-like-results-list)
- [Select code to search](#select-to-search)
- [Files list filters](#files-list-filters)
- [Case sensitivity](#case-sensitivity)
- [Search errors](#search-errors)

**Example Queries**

- [All usages of `console` object](#all-usages-of-console-object)
- [Object with given key and value](#object-with-given-key-and-value)
- [React component with specific props combination](#react-component-with-specific-props-combination)
- [React bad patterns](#react-bad-patterns)
- [Conditionally set parameter of a function](#conditionally-set-parameter-of-a-function)

> Don't know how to write a query? [Open an issue on GitHub](https://github.com/codeque-co/codeque/issues) !

## Features

### Query language

The beauty of CodeQue query language is that the query has to be valid source code.
You don't have to learn anything new!

Except the fact there are a few types of wildcards.

`$$` is an identifier wildcard.

It matches all identifiers, JSX identifiers, types identifiers, function names and so on.

`$$$` is an statement/expression wildcard.

It matches any statement or expression. Think of it as 'match anything'.
There a few quirks there. It's good to have general understanding of how code is represented in AST (Abstract Syntax Tree) for more complex queries.

More technically `$$$` wildcard is matching any node with all it's children.

#### Wildcards in strings

Strings have their's own wildcards

`$$` - matches 0 or more characters

`$$$` - matches 1 or more characters

#### Number wildcard

`0x0`- matches any number

Here is an example of query which finds all types of logs which includes word `test` in parameter 👇

<img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/example-query.png?raw=true" />

> Read more about wildcards and query language in [docs](https://codeque.co/docs#writing-a-query)

### Search modes

CodeQue offers the following search modes

- include
- text
- exact
- include with order

<br/>
 
The most useful mode is `include`. As the name suggest the matched code has to include the code from query, but it can also contain other statements. It performs structural comparison.

[Learn more about `include` search mode](https://codeque.co/docs#include-search-mode)

<br/>

`text` search mode is good replacement of build-in vscode search. It acts like a normal text search, but it's big advantage is that it allows for matching multiline statements. It also offers it's own types of wildcards.

[Learn more about `text` search mode](https://codeque.co/docs#include-search-mode)

<br/>

Sometimes you might want to find the code that matches exactly your query. Here is where `exact` search mode is useful. It performs structural comparison, so code formatting is not a problem.

[Learn more about `exact` search mode](https://codeque.co/docs#exact-search-mode)

<br/>

Last but not least, `include-with-order` search mode can be useful in some rare cases. Same like `include` mode it matches code structurally and allows for missing parts, but in addition, it require the order to match.

[Learn more about `include-with-order` search mode](https://codeque.co/docs#include-w-ith-order-search-mode)

<br/>

Here is the example of `include` mode matching function body containing statements from query 👇

<img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/include-search-mode-example.png?raw=true" />

### Searching by file imports

Cool feature of CodeQue is ability to search within files that are directly and indirectly imported by given entry point. CodeQue generates file's dependency tree and search through all nodes. Simply file dependency based search.

It's handy for finding whether a given module is used in given part of application or find a code causing a bug when proper stack trace is not available.

To get started you can enter the file path manually in search settings.

However easier way of searching by file imports is to use option `CQ: Search by Entry Point` in file explorer context menu 👇

<img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/search-by-entry-point.png?raw=true" />

### Todo-like results list

Ability to manage search results list is very handy for refactoring. You can collapse or remove not relevant results and mark others as done after you make changes. I've very similar UX to Github Pull Request review view.

<img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/results-list.gif?raw=true" />

### Select to search

Another handy addition is the possibility to search by code selected in editor, so you don't have to copy-paste the query. It's just faster.

After making a selection simply click `🔍 Open Search` button in Status bar on the bottom of editor, or use context menu option `CQ: Open Search`.

CodeQue will automatically detect whether select text is valid code and perform search using recently used structural [search mode](#search-modes). Otherwise it would fallback to `text` search mode.

<img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/select-to-search.gif?raw=true" />

### Files list filters

Search wouldn't be useful without ability to filter files list.

You can define glob patters to either include or exclude files from the list.

By default CodeQue is not searching in files ignored by `.gitignore`

Enable the following flags with caution, as they might significantly downgrade search performance for lager projects.

- Search ignored files
- Search `node_modules` (for most projects to search node_modules you have to also enable searching by ignored files)
- Search files above 100kb (these are usually bundled files which are structurally heavy due to their size and amount of information)

Example files list settings 👇

<p align="center">
  <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/files-list-settings.png?raw=true" width="400px" />
</p>

### Case sensitivity

You can choose whether to compare identifier persisting their original case or do case insensitive match.

### Search errors

Sometimes you might encounter some search errors. They will be mostly due to some syntax errors in you source files.

You can check search error details in tooltip available after click the error count message 👇

<img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/search-error.png?raw=true" />

## Query examples

CodeQue is general purpose code search tool. The examples list could be endless. Here are some of them for you to get a glimpse of what's possible. Those are relatively simple, you will definitely find some more complex during day to day work.

> Don't know how to write a query? [Open an issue on GitHub](https://github.com/codeque-co/codeque/issues) !

### All usages of `console` object

Searching for console logs, warnings, errors is quite simple use-case and can be achieved using traditional tools, but It's for you to warm up 😁

This query finds all places in the code that can output some (usually unwanted) logs.

```ts
console.$$()
```

### Object with given key and value

CodeQue ability to match parts of the objects might be very useful, especially for searching patterns in large JSONs.

This query will match part of an object literal in file or JSON (depending on file extension) regardless of how deeply nested the object is in the structure.

More specifically it will match all objects with at least one address entry with country specified to `PL` and phone number which is non empty string.

```ts
;({
  addresses: [
    {
      country: 'PL',
    },
  ],
  phoneNumber: '$$$',
})
```

> When searching for objects, make sure to use expression brackets `({})`. Otherwise CodeQue would parse the query as code block

### React component with specific props combination

I found it very useful to find props with specific props combination. Sometimes props depends on each other and we might want to refactor some of them, but how do we determine whether they are used together? We can review long list of results for basic code search, but who has time for that 😉

```tsx
<Button variant="ghost" size="sm" colorScheme="red" />
```

### React bad patterns

This quite simple query highlights usage of object literal as a prop. It could be extracted to variable to upper scope or memoized.

Assuming we use `include` mode, the object can have 0 or more properties with any values.

```tsx
<$$ $$={{}} />
```

This query finds places where a given array is mapped directly in JSX. It could be memoized to make the array reference stable and reduce re-renders.

> In `include` search mode query `<$$/>` will match components with and without children!

```tsx
<$$ $$={$$$.map(() => $$$)} />
```

One last example is another variation of the above, this time with inline function that should be memoized using `useCallback` hook.

> Note that we used `() => $$$`, not `() => {}`.
> Triple wildcard will match both function body as a block, but also as an expression.

```tsx
<$$ $$={() => $$$} />
```

### Conditionally set parameter of a function

This query was posted by one of CodeQue users. They wanted to find all conditionally set apiMethod parameter of `useRequest` hook.

We use `$$$` to be more generic for matching parts of conditional expression.

```ts
useRequest({
  apiMethod: $$$ ? $$$ : $$$,
})
```

### Unstable hook reference

Some 3rd party hooks are not implemented correctly and return non-memoized variables.

Let's assume you've found out that `confirm` callback from `useAsyncDialog` is unstable.

You can use the snipped below to search for all similar places across the codebase and fix then if necessary.

This is interesting example that links together two statements in the same code block, that does not necessarily have to directly follow each other.

```ts
const { confirm } = useAsyncDialog()
const $$ = useCallback($$$, [confirm])
```

## Telemetry

Extension collects anonymous telemetry to help me get insights about usage.

It's implemented using `@vscode/extension-telemetry` and respects you editor telemetry settings.

Learn more about [telemetry](https://codeque.co/docs/telemetry#vs-code-extension)

## Support and feedback

Feel free to use [Github Issues](https://github.com/codeque-co/codeque/issues)
to

- ask for help with writing a query
- report a bug or doubt
- suggest feature or improvement

<!-- FOOTER START -->

## Support and feedback

Feel free to use [Github Issues](https://github.com/codeque-co/codeque/issues)
to

- ask for help with writing a query
- report a bug or doubt
- suggest feature or improvement
