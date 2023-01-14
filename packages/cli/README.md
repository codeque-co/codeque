<h3 align="center">
  <code>CodeQue</code>
</h3>

<p align="center">
  Supercharged structural code search and replace tool
</p>

---

## Overview 📣

CodeQue is structural code search tool for TypeScript and JavaScript projects.

CodeQue can be used to search for any code, from simple symbol search to complex multiline patterns.

It reduces struggle by providing accurate results regardless the formatting noise.

It makes it easy to get familiar with codebase and helps make better decisions as a result.

You can also use it as a linter.

Find out more about the project on [codeque.co](https://codeque.co)

[Try CodeQue Visual Studio Code Extension](https://marketplace.visualstudio.com/items?itemName=CodeQue.codeque)

## Installation 👇

```sh
yarn global add @codeque/cli
```

## Usage 🕵️

Run `codeque` to start CLI query editor.

```sh
codeque
```

Type query and hit `ctrl+s` to run your first search!

<img src="https://github.com/codeque-co/codeque/blob/df44bcfd393c5a954877790c9d1eb0adc5a2f4da/packages/cli/demo.gif?raw=true" alt="codeque cli demo" width="500px"/>

### CodeQue CLI features:

- four search modes
- search by file dependency
- search by files changed since last commit
- clickable file links with code position (CMD + pointer click)
- case insensitive search
- API to use codeque as restricted code pattern guard

Find out **how to use wildcards and discover search modes** in [codeque docs](https://codeque.co/docs)!

## Use cases 🧑‍💻

In first place it's code search, so you can use it to search any code (as long as it is TypeScript or JavaScript - more languages in future).

Here are some use cases where CodeQue shines ✨

### Search duplicated code 🍣

Once you spot some code pattern in more than one place, you can just copy and search for it.

You will find all occurrences and you will be bale to get rid of repetition forever!

### Search API usage 🧰

I love using CodeQue to look for specific function or React hook usage. It's faster than looking for API into docs.

This a typical query that you can use to find usage of some React hook.

```ts
const $$$ = useMyHook();
```

### Assertions ☔

You can use CLI to ensure that some bad code patterns will not be introduced into the codebase.

It's not that handy as ESLint (an CodeQue ESLint plugin is commit soon!), but at least you will not waste time for implementing custom plugins!

Use this to ensure there are no skipped tests in the codebase:

```sh
codeque --query "$$.skip()" "$$.only()" --invertExitCode
```

> Flag `--invertExitCode` will revert default behavior of exit codes, and return non zero exit code when matches would be found.

### Git hooks 🪝

I use codeque with `text` mode for my pre-commit hook.

> `text` mode is faster than other modes, because it's regexp based.

I want to ensure there will be no console.logs, todos, and skipped tests introduced in my commit.

`.git/hooks/pre-commit` content

```sh
#!/bin/sh

codeque --git --query '$$.only(' '$$.skip(' 'console.log(' '// todo' --mode text --invertExitCode --caseInsensitive

if [ $? -ge 1 ] ; then
  echo '🛑 Found restricted code. Terminating.'
  exit 1
fi
```

## CLI reference 📖

<!-- cli-docs-start -->

### Root command `codeque`

Opens interactive terminal editor to type query and performs structural code search in current working directory. Alternatively performs search based on query provided as an param or query file.

#### Usage

```sh
codeque [options]
```

#### Options

- `-m, --mode [mode]` - Search mode: exact, include, include-with-order, text (_optional_)
- `-r, --root [root]` - Root directory for search (default: process.cwd()) (_optional_)
- `-e, --entry [entry]` - Entry point to determine search files list based on it's imports (excluding nodeˍmodules) (_optional_)
- `-i, --caseInsensitive` - Perform search with case insensitive mode (_optional_)
- `-l, --limit [limit]` - Limit of results count to display (_optional_)
- `-q, --query [query...]` - Inline search query(s) (_optional_)
- `-qp, --queryPath [queryPath...]` - Path to file(s) with search query(s) (_optional_)
- `-g, --git` - Search in files changed since last git commit (_optional_)
- `-iec, --invertExitCode` - Return non-zero exit code if matches are found. Useful for creating assertions (_optional_)
- `-v, --version` - Print CLI version (_optional_)
- `-pfl, --printFilesList` - Print list of searched files (_optional_)
- `-ogi, --omitGitIgnore` - Search files regardless .gitignore settings (_optional_)
- `-ae, --allExtensions` - Search in all file extensions. Useful for text search mode. (_optional_)
<!-- cli-docs-end -->
