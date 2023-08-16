# CodeQue Tree Sitter port

This repo is set of scripts to manage building files required for Tree Sitter parsers to work with CodeQue.

It includes:
- Fetching newest versions of parsers
- Building WASM files
- Generating node type mappings
- Copying generated files into `vscode` and `core` directories

## Usage

Upgrade integrated parsers versions if needed

`yarn parsers-upgrade`

Build wasm files for parsers and generate mappings for node fields

`yarn build-wasm-and-generate-mappings`


Copy generated files into `vscode` and `core` directories

`yarn copy-files`

## Preparation to generate wasm files

Follow the requirements installation steps in [tree sitter readme](https://github.com/tree-sitter/tree-sitter/blob/master/lib/binding_web/README.md#generate-wasm-language-files)

What's needed
- Emscripten (currently working with non-docker installation )
- tree-sitter-cli
