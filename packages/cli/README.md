<p align="center">
  <a href="https://codeque.co/?utm_source=readme_cli" title="Learn more about CodeQue" target="_blank">
    <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/media/logoShort.png?raw=true" width="200px" />
  </a>
  <br/>
  </p>
<p align="center">
  <a href="https://codeque.co/?utm_source=readme_cli">Website</a>&nbsp;&nbsp;•&nbsp;&nbsp;  
  <a href="https://codeque.co/docs?utm_source=readme_cli">Docs </a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/roadmap?utm_source=readme_cli">Roadmap</a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/mission?utm_source=readme_cli">Mission</a>&nbsp;&nbsp;•&nbsp;&nbsp; 
  <a href="https://codeque.co/playground?utm_source=readme_cli"><b>Playground</b></a>
</p>

<p align="center">Streamline your workflow by finding and linting complex code patterns effortlessly.</p>

___ 

# What is CodeQue?

CodeQue is semantic code search engine that understands the code syntax. 

It matches code structurally which makes it excellent for more complex queries.

Query language offers wildcards, partial matching and ignores code formatting. 

Structural code search is available for JavaScript, TypesScript, HTML, CSS and more soon.

Text code search with handy wildcards is available for __every language__ and covers common regex search use cases.

<p align="center"><a href="https://codeque.co/playground?utm_source=readme_cli"><b>Give it a try in 
 playground</b></a></p>

<p align="center"><i>Just paste code snippet to start searching, no installation needed!</i></p>

__Integrations__

CodeQue is available as:

- [VSCode extension](https://marketplace.visualstudio.com/items?itemName=CodeQue.codeque) for delightful code search and navigation experience.
- [ESLint integration](https://www.npmjs.com/package/@codeque/eslint-plugin) for creating custom linting rules in zero time.
- [CLI tool](https://www.npmjs.com/package/@codeque/cli) for searching code and more including headless environments.

<p align="center"><i>All CodeQue tools <b>operate offline</b> hence code never leaves your local environment.</i></p>

__Coming soon__

CodeQue will be soon available as:

- Duplicated code identification
- Batch code refactoring 
- Advanced ESLint rule creator 


<p align="center"><a href="https://jayu.dev/newsletter?utm_source=readme_cli"><b>🔔 Get notified about updates 🔔 </b></a></p>


</br>

<!-- HERO END -->
  
<!-- CLI INTRO START -->
## CLI tool 🔥

CodeQue CLI is a complementary tool that can be used for
- Searching code patterns right from terminal including headless environments
- Building scripts to assert that some code patterns exist or not exist
- Enhancing git hooks to avoid committing or pushing unwanted code

<!-- CLI INTRO END -->

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

<p align="center">
<img src="https://github.com/codeque-co/codeque/blob/master/packages/cli/demo.gif?raw=true" alt="codeque cli demo" />
</p>

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

<!-- FOOTER START -->

## Support and feedback

Feel free to use [Github Issues](https://github.com/codeque-co/codeque/issues)
to
- ask for help with writing a query
- report a bug or doubt
- suggest feature or improvement