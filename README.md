## MVP CLI

Names:
  - magic search (more catchy for search)
  - code query (the best for set of tools)
  - code magic (taken :/)
  - magic code search (kinda too long)
  - Quecode
    - quecode.dev if free
  - CodeQ
  - CodeQue
    - codeque.dev if free

✅ Fix bug with `<$>$</$>;` matching too much - JSX text wildcard acts like $$ o.O

✅ restrict more than 2 wildcards on query parse level

✅ Adjust formatting of multiline code that is staring after some tokens

✅ Make CLI a product
   - ✅ codeframe from babel
   - ✅  investigate results formatting query :`<Text $="ellipsis" ></Text>`
      - how we can present original code instead of generated one
      - ✅ fix problem with 0 padding
   - ✅ commander
   - ✅ spinner while search
   - ✅ results limit param
   - ✅ convenient multiline input 
    - ✅ find better tokenizer (fixed js-tokens)
   - ✅ file path query
   - ✅ runs in cwd

❌ Explore types matching and types literals -> tests on custom file

✅ Bug with code generation for `<$ $={`${$$}`} />;` // use-case: probably redundant template literal (value can be not a string)
   - implement tests for this
   - implement tests for `<$ $={`fdsgg`} />;` // use-case: redundant template literal
   - template literal seems to not work properly in exact mode

✅ Support wildcards in JSXText

✅ Support for case insensitive search
  - only for wildcards for now
  - actually it might be easy, we should check if primitive value is string

✅ Support json

✅ Bundle/minify/obfuscate

❌ Invent / Implement license mechanism
   - try webassembly

❌ Add support for proposal syntaxes

✅ Add support for multiple wildcards
  - `($$, $$) => {}` is invalid while parsing function
  - `$_refN` - currently without ref analysis
  - `$$_refN` - currently without ref analysis

❌ PoC / Implement vscode extension - mostly to understand how to license

✅ Implement tests

✅ Add literal wildcards
  - string literal cannot be replaced with identifier in some scenarios eg import
  - we should be able to always use identifier wildcard in place of number
  - we still need number wildcard for some cases (we want to have number, not any identifier)


✅ Add support for regexp identifier matches (on$ -> onClick, onHover etc)


✅ Better handling of query errors 
  - return outside a function
  - await outside async fn
  - explore parse result errors

✅ Regex matching of identifier seems to be slow 
  - ✅ one perf issue was caused by prettier - fixed!
  - double the time on mac for `"import { $Plus } from 'react-icons$'"`
  - maybe instead of `"."` regex we could be more specific
  - ✅ it might be caused by lack of keywords for initial search
    - try to use keywords regexes in tokens search
    - ✅ try to escape `"$"` from tokens - should be faster than several regex
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


Get files edited since last commit `echo  $(git diff --name-only HEAD)`
___

## Further product development

💡 Feature import-based search
  - search in file and all files imported by a file
  - eg. your test failed
    - you search for test based on name
    - you specify a query to find failing code patterns in files imported by test

💡 Think of negation syntax and sense (just to make if future proof for now)
  - could be something like: `$not('asd')`
  - it might execute 2 (or more) searches and filter results if there are 2 the same

💡 Think of and, or syntax and sense (just to make if future proof for now)
  - could be something like: `$and('asd', $not(() => {}))`
  - jsx excluding some prop`$and(<somejsx>, $not(<somejsx prop={$$}/>))`

💡 Think of support for ref matching
  - user should be able to indicate that two wildcards are the same identifier 
  - eg. `const $_ref1 = 'string'; call($_ref1)`

💡 Add query extensions
  - `$type()` - to create type matcher
    - can be only used top-level
  - `$exact(), $include(), $includeWithOrder()` - to change mode in given code path
    - <$ $={() => {}} /> will match functions with body, which we don't want
  - `$fn(() => {})` - alias for 3 types of function definition
    - effectively executes 3 queries
  - It might be useful to search for expressions within nested structures inside functions to make it more useful
      - it might need special operator like `$nested()`
  - `$jsx()` - for jsx tags when children can be ignored
     - executes 2 query for self-closing and not self closing

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
    - plugin should have reference analisys (user should be able to mark that two identifiers should be the same, eg using `$_ref1`)
  - automated codemod - this one needs a PoC
    - check some codemods
    - program should be able to get diff of AST
    - 3 steps
      - implement query
      - implement transformed query
      -> generate AST diff and use it as a transform (try use json-diff with removed misc keys)
      - show example result
  - predefined codemode snippets to apply on file
    - eg. transform props into `1{prop1, prop2}` based on which keys are used
    - a) it could be eslint plugin / no need for code-magic for that 
    - b) it might be impossible to implement with current approach to codemod
  - for codemod and eslint we need to be able to reference a variable by identifier, to be able to track references for more complex cases
  - track duplicated code - how (eg. pattern to match all DB queries, then exact compare of AST)
    - this could be integrated into editor, so it could search duplicates as you type code
    - predefined patterns to find in current file
    - if pattern is found in given file, search for exact code in other files
  - metrics: project has 1000 DB queries, project has 3000 react components
  - check what SonarQube can measure
  - tool like rev-dep could be part of code-magic toolset
    - think how it could improve refactoring
    - it should not only resolve imports, but references in code as well, so it would be more accurate (should resolve like stack trace)
    - it helps with
      - refactoring & finding all refactored views to test them
      - saves a lot of time spent on manual references lookup
  - Feature: get all values of given property
    - eg. to assert unique test-ids across all files
  - Feature import-based search
    - search in file and all files imported by a file
    - eg. your test failed
    - you search for test based on name
      - you specify a query to find failing code patterns in files imported by test
  - Feature - get unique values of `$_ref/$$_ref`  in query

💡 Add support for suggestions based on equivalent/similar syntax
  - user input: `<$ prop={"5"} />`,  suggestion: `<$ prop="5" />`
  - user input: `<$ prop={$+$} />`,  suggestion: `<$ prop={$-$} />`

💡 Add hints based on first node
  - user input: `{a:b}`, hint: You probably needs `({a:b})`, right now it is a block statement
  - use input `"some string"`: You probably needs `("some string")`, right now it is a directive

💡 To secure the code we should 
  - verify license in WASM
  - implement parts of the algorithm in WASM
  - implemented parts do not work if license is not verified

💡 Add support for flow
  - Probably needs a refactor similar to different language refactor

💡 Pricing
  - Free only exact mode, no wildcards, no other features
    - code stats
  - Paid $19 / year (dev)
    - search with all features 
    - code stats
    - exclude replace, ref analysis, import resolution
  - Paid $29 / year (pro)
    - search + replace + ref analysis + import resolution
    - code stats
  - Company $29 / month
    - up to 10 users (+$3 for each additional user)
    - all the above + eslint rules 
  

💡 Product website
  - home
    - landing
    - showcase
    - pricing
  - docs
  - playground
  - examples


⌛ Marketing Implement stats script and encourage ppl to share their results on Twitter
  - N files
  - N JS/TS files
  - N import statements
  - N require statements
  - N string literals
  - N empty strings
  - N zeros
  - N functions
  - N arrays
  - N objects literals

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
 - "Pay tech debt quicker"
 - after changing prisma data model we can find interface/class for changed entity and adjust fields

✅
❌
⌛
💡