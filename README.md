
❌ Implement tests!!!

❌ Add literal wildcards
  - string literal cannot be replaced with identifier in some scenarios eg import
  - we should be able to always use identifier wildcard in place of number
  - we still need number wildcard for some cases

✅ improve query parsing
  - first try to parse without brackets, then add brackets and parse once again

❌ Add support for regexp identifier matches (on$ -> onClick, onHover etc)

❌ Add support for nested gitignore

❌ Feature import-based search
  - search in file and all files imported by a file
  - eg. your test failed
    - you search for test based on name
    - you specify a query to find failing code patterns in files imported by test

✅ Do benchmark (done)
  - mac 1.4s
  - desktop 2.6s 
  - laptop 4.5s

✅ Do profiling
  - maybe we can optimize by identifiers search
    - probably there is amount of identifiers that we can search to gain time,but if we search for too many, we will lose time
    - just one identifier is a good starting point

❌ Think of negation syntax and sense (just to make if future proof for now)
  - could be something like: $not('asd')
❌ Think of and, or syntax and sense (just to make if future proof for now)
  - could be something like: $and('asd', () => {}) 
❌ Think of support for ref matching
  - user should be able to indicate that two wildcards are the same identifier 
  - eg. const $_ref1 = 'string'; call($_ref1)

⌛ Think of other use cases for the matching functionality (call the whole product code-magic)
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

❌ Add support for suggestions based on equivalent/similar syntax
  - user input: <$ prop={"5"} />,  suggestion: <$ prop="5" />
  - user input: <$ prop={$+$} />,  suggestion: <$ prop={$-$} />
❌ Add hints based on first node
  - user input: {a:b}, hint: You probably needs ({a:b}), right now it is a block statement

To secure the code we should 
  - verify license in WASM
  - implement parts of the algorithm in WASM
  - implemented parts do not work if license is not verified
 
✅
❌
⌛