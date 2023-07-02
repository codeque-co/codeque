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

<a href="https://codeque.co/vscode-demo-sound.mp4" target="_blank" title="Click to watch demo video">
    <img src="https://github.com/codeque-co/codeque/blob/master/packages/vscode/readme-media/intro.gif?raw=true" />
</a>

</br>
<!-- VSCODE INTRO END -->
  
<!-- ESLINT INTRO START -->
## ESLint integration 💅

Using CodeQue ESLint plugin you can create your own custom linting rules in zero time.

Custom ESLint rules can help execute on long-term refactors or prevent introducing codebase specific bugs or bad patterns.

Rules can replace your decision log and help standardizing coding conventions across the project or organization.

CodeQue ESLint integration is a no-brainier for any team willing to improve their codebase quality.

<!-- ESLINT INTRO END -->

Installation 👇

```sh
yarn add --dev @codeque/eslint-plugin
```


Usage ✨

[See docs on npm](https://www.npmjs.com/package/@codeque/eslint-plugin)


```ts
{
  plugins: ['@codeque'],
  rules: [
    "@codeque/error": ["error", [
      {
        "query": "throw new Error()",
        mode: "include",
        message: "Use only project defined error classes.",
      },
    ]]
  ]
}
```

<p align="center">
<img src="https://github.com/codeque-co/codeque/blob/master/packages/eslint/readme-media/error-example.png?raw=true" width="500px"/>
</p>


## CLI tool 🔥

CodeQue can be also used as a CLI tool.

Use it to search code or utilize it in git hooks like pre-commit.

__Installation 👇__

```sh
yarn global add @codeque/cli
```

__Usage 🕵️__

```sh
codeque
```

<img src="./packages/cli/demo.gif" alt="codeque cli demo" width="500px"/>

Find more info in [`@codeque/cli` package docs](./packages/cli/README.md)

<!-- FOOTER START -->

## Support and feedback

Feel free to use [Github Issues](https://github.com/codeque-co/codeque/issues)
to
- ask for help with writing a query
- report a bug or doubt
- suggest feature or improvement