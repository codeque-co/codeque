<h3 align="center">
  <code>CodeQue</code>
</h3>

<p align="center">
  Supercharged structural code search and replace tool
</p>

> Currently in beta!

---

## Overview 📣

CodeQue is structural code search tool for TypeScript and JavaScript projects.

CodeQue can be used to search for any code, from simple symbol search to complex multiline patterns.

It reduces struggle by providing accurate results regardless the formatting noise.

It makes it easy to get familiar with codebase and helps make better decisions as a result.

You can use it also as a linter.

Find out more on [codeque.co](https://codeque.co)

## Installation 🔥

```sh
yarn global add @codeque/cli
```

## Usage ⌨️

Run `codeque` to start CLI query editor.

```sh
codeque
```

Type query and hit `ctrl+s` to run your first search!

Find out how to use wildcards and discover search modes in [codeque docs](https://codeque.co/docs)!

<img src="demo.gif" alt="codeque cli demo"/>

## Use cases 🧑‍💻

In first place it's code search, so you can use it to search any code (as long as it is TypeScript or JavaScript - more languages in future)

Here are some use cases where CodeQue shines

### Search duplicated code

### Search API usage
### Assertions 
(yarn test:restricted-code)

### Git hooks 
(my pre-commit hook)

## CLI reference 📖

<!-- cli-docs-start -->

### Root command `codeque`

Opens interactive terminal editor to type query and performs structural code search in current working directory. Alternatively performs search based on query option or query file.

#### Usage

```sh
codeque [options]
```

#### Options

- `-m, --mode [mode]` - Search mode: exact, include, include-with-order, text (_optional_)
- `-r, --root [root]` - Root directory for search (default: process.cwd()) (_optional_)
- `-e, --entry [entry]` - Entry point to determine search files list based on it's imports (excluding node*modules) (\_optional*)
- `-i, --case-insensitive` - Perform search with case insensitive mode (_optional_)
- `-l, --limit [limit]` - Limit of results count to display (_optional_)
- `-q, --query [query...]` - Inline search query(s) (_optional_)
- `-qp, --queryPath [queryPath...]` - Path to file(s) with search query(s) (_optional_)
- `-g, --git` - Search in files changed since last git commit (_optional_)
- `-iec, --invertExitCode` - Return non-zero exit code if matches are found. Useful for creating assertions (_optional_)
- `-v, --version` - Print CLI version (_optional_)
- `-pfl, --printFilesList` - Print list of searched files (_optional_)
- `-ogi, --omitGitIgnore` - Search files regardless .gitignore settings (_optional_)
<!-- cli-docs-end -->
