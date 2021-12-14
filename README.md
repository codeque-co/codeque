
✅ Implement tests

✅ Add literal wildcards
  - string literal cannot be replaced with identifier in some scenarios eg import
  - we should be able to always use identifier wildcard in place of number
  - we still need number wildcard for some cases (we want to have number, not any identifier)

⌛ Explore types matching and types literals -> tests on custom file

✅ Add support for regexp identifier matches (on$ -> onClick, onHover etc)

❌ Add support for multiple wildcards
  - ($$, $$) => {} is invalid while parsing function
  - $_refN // currently without ref analysis
  - $$_refN // currently without ref analysis

❌ Add support for proposal syntaxes

❌ Better handling of query errors 
  - return outside a function
  - await outside async fn
  - explore parse result errors

❗ Regex matching of identifier seems to be slow 
  - one perf issue was caused by prettier - fixed!
  - double the time on mac for "import { $Plus } from 'react-icons$'" 
  - maybe instead of "." regex we could be more specific
  - it might be caused by lack of keywords for initial search
    - try to use keywords regexes in tokens search
    - try to escape "$" from tokens - should be faster than several regex
    - try to use language keywords like import, for,as
      - might not help much

✅ improve query parsing
  - first try to parse without brackets, then add brackets and parse once again

✅ Add support for nested gitignore


✅ Do benchmark (done)
  - mac 1.4s
  - desktop 2.6s 
  - laptop 4.5s

✅ Do profiling
  - maybe we can optimize by identifiers search
    - probably there is amount of identifiers that we can search to gain time,but if we search for too many, we will lose time
    - just one identifier is a good starting point

❌ PoC / Implement vscode extension

❌ Invent / Implement license mechanism

⌛ Make CLI a product
   ✅ codeframe from babel
   - commander
   - spinner while search
   - results limit param
   - inline input 
   - file path input
   - runs in cwd

💡 Feature import-based search
  - search in file and all files imported by a file
  - eg. your test failed
    - you search for test based on name
    - you specify a query to find failing code patterns in files imported by test

💡 Think of negation syntax and sense (just to make if future proof for now)
  - could be something like: $not('asd')
💡 Think of and, or syntax and sense (just to make if future proof for now)
  - could be something like: $and('asd', () => {}) 
💡 Think of support for ref matching
  - user should be able to indicate that two wildcards are the same identifier 
  - eg. const $_ref1 = 'string'; call($_ref1)

💡 Think of other use cases for the matching functionality (call the whole product code-magic)
  - should the product be an licensed cli ?
  - vscode search extension
      - other editors extensions (how to, which languages)
      - Webstorm 
        - Java, but can execute JS somehow - need more reading
  - cli search - why not
  - standalone desktop app
  - eslint plugin restricted syntax 
    - check in autozone if custom plugins could be replaced
    - check which of the existing plugins could be replaced
    - plugin should have reference analisys (user should be able to mark that two identifiers should be the same, eg using $_ref1)
  - automated codemod - this one needs a PoC
    - check some codemods
    - program should be able to get diff of AST
    - 3 steps
      - implement query
      - implement transformed query
      -> generate AST diff and use it as a transform (try use json-diff with removed misc keys)
      - show example result
  - predefined codemode snipets to apply on file
    - eg. transform props into {prop1, prop2} based on which keys are used
    - a) it could be eslint plugin / no need for code-magic for that 
    - b) it might be impossible to implement with current approach to codemod
  - for codemod and eslint we need to be able to reference a variable by indentifier, to be able to track references for more complex cases
  - track duplicated code - how (eg. pattern to match all DB queries, then exact compare of AST)
    - this could be integrated into editor, so it could search duplicates as you type code
    - predefined patterns to find in current file
    - if pattern is found in given file, search for exact code in other files
  - metrics: project has 1000 DB queries, project has 3000 react components
  - check what SonarQube can measure
  - tool like rev-dep could be part of code-magic toolset
    - think how it could improve refactoring
  - Feature: get all values of given property
    - eg. to assert unique test-ids across all files
  - Feature import-based search
    - search in file and all files imported by a file
    - eg. your test failed
    - you search for test based on name
      - you specify a query to find failing code patterns in files imported by test
  - Feature - get unique values of $_ref/$$_ref in query

💡 Add support for suggestions based on equivalent/similar syntax
  - user input: <$ prop={"5"} />,  suggestion: <$ prop="5" />
  - user input: <$ prop={$+$} />,  suggestion: <$ prop={$-$} />
💡 Add hints based on first node
  - user input: {a:b}, hint: You probably needs ({a:b}), right now it is a block statement
  - use input `"some string"`: You probably needs `("some string")`, right now it is a directive

💡 To secure the code we should 
  - verify license in WASM
  - implement parts of the algorithm in WASM
  - implemented parts do not work if license is not verified

💡 Add support for flow
  - Probably needs a refactor similar to different language refactor

💡 Product website
  - home
    - landing
    - showcase
    - pricing
  - docs
  - playground
  - examples

⌛ Marketing use-cases for search
  - You want to find how a component is used across the codebase to see examples without going to docs
  - You want to track where the piece of code is duplicated across the codebase
  - You spot a code pattern that can cause issues (eg. react falsy event listener) and you want to check where else it is used
  - You want to check places where a component with specific set of props is used while refactoring to test changes properly
  - You are curious about usage statistics of some patterns in the codebase (count of components, functions)
    - there could be predefined set of measurements to run
  - More specific
    - You are adding i18n and you want to check where in codebase a specific text string is used
⌛ Marketing use-cases for eslint rule
  - 
⌛ Marketing use-cases for eslint codemod
 - 

✅
❌
⌛
💡
⚠️