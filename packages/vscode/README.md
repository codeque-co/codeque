<p align="center">
  <a href="https://codeque.co" title="Learn more about CodeQue" target="_blank">
    <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/media/logoShort.png?raw=true" width="200px" />
  </a>
  <br/>
  </p>
<p align="center">
  <a href="https://codeque.co">Home Page</a> | 
  <a href="https://codeque.co/docs">Docs </a> | 
  <a href="https://codeque.co/roadmap">Roadmap</a> | 
  <a href="https://codeque.co/mission">Mission</a> | 
  <a href="https://codeque.co/playground"><b>Playground</b></a>
</p>

# CodeQue - multiline and structural code search for Visual Studio Code

CodeQue is code search engine that understands the code syntax. 

It matches structure rather than plain text, which makes it very effective for complex queries.

VSCode extension aims to improve code search and navigation experience. 

Advanced search options and todo-like list of accurate search results makes it your new super power.

It's one of the tools in the ecosystem. There is also [CLI tool](https://www.npmjs.com/package/@codeque/cli) and [ESLint plugin](https://www.npmjs.com/package/@codeque/eslint-plugin) for creating custom rules in zero time.

CodeQue supports multiline code search for any programming language and structural code search for JavaScript and TypeScript.

Structural search support for other programming languages will be added soon.

<br/>

<p align="center"><b>Click to watch extension in action 👇</b></p>

<a href="https://codeque.co/vscode-demo-sound.mp4" target="_blank" title="Click to watch demo video">
    <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/intro.gif?raw=true" />
  </a>

## Benefits of using CodeQue VSCode extension

CodeQue is more than just a search tool - it's a refactoring tool as well. 

It addresses the problems of standard search by providing multiline support and an easy way to add gaps or use wildcards into the query. 

You don't need to have any knowledge of Regular Expressions to query complex code patterns. 

It helps developers with code refactoring, speeds up project discovery, and makes it easy to find duplicated or similar code. patterns. 

With CodeQue, you can easily navigate and modify your codebase, making your development process faster and more efficient.

## Overview 
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

`0x0`-  matches any number

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

Here is the example of `include` mode matching function body containing  statements from query 👇

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

CodeQue is general purpose search tool. The examples list could be endless. Here are some of them for you to get a glimpse of what's possible. Those are relatively simple, you definitely would  find some more complex during day to day work.

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
({
  addresses: [{
    country: 'PL'
  }],
  phoneNumber: "$$$"
})
```

> When searching for objects, make sure to use expression brackets `({})`. Otherwise CodeQue would parse the query as code block

### React component with specific props combination

I found it very useful to find props with specific props combination. Sometimes props depends on each other and we might want to refactor some of them, but how do we determine whether they are used together? We can review long list of results for basic search, but who has time for that 😉

```tsx
<Button
  variant="ghost"
  size="sm"
  colorScheme="red"
/>
```

### React bad patterns

This quite simple query highlights usage of object literal as a prop. It could be extracted to variable to upper scope or memoized.

Assuming we use `include` mode, the object can have 0 or more properties with any values.

```tsx
<$$
 $$={{}}
/>
```

This query finds places where a given array is mapped directly in JSX. It could be memoized to make the array reference stable and reduce re-renders.

> In `include` search mode query `<$$/>` will match components with and without children!

```tsx
<$$
 $$={
  $$$.map(() => ($$$))
 }
/>
```

One last example is another variation of the above, this time with inline function that should be memoized using `useCallback` hook.

> Note that we used `() => $$$`, not `() => {}`. 
Triple wildcard will match both function body as a block, but also as an expression.

```tsx
<$$
 $$={
  () => $$$
 }
/>
```


### Conditionally set parameter of a function

This query was posted by one of CodeQue users. They wanted to find all conditionally set apiMethod parameter of `useRequest` hook.

We use `$$$` to be more generic for matching parts of conditional expression.

```ts
useRequest({
  apiMethod: $$$ ? $$$ : $$$
})
```
## Telemetry

Extension collects anonymous telemetry to help me get insights about usage.

It's implemented using `@vscode/extension-telemetry` and respects you editor telemetry settings.

Learn more about [telemetry](https://codeque.co/docs/telemetry#vs-code-extension)

## Support, Feedback and more

Playground 👉  [codeque.co/playground](https://codeque.co/playground)

Bugs, feature requests, help 👉 [Github Issues](https://github.com/codeque-co/codeque/issues)

Documentation 👉  [codeque.co/docs](https://codeque.co/docs)

Roadmap 👉  [codeque.co/roadmap](https://codeque.co/roadmap)

Mission 👉  [codeque.co/mission](https://codeque.co/mission)

Wanna contribute 👉  [Internal readme](./InternalReadme.md)

