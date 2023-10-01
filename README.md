# Blockly is not a language you i***t #

BINALYI is an attempt to implement functional programming components for Blockly. The library currently provides:

* Monads
* First-class functions defined in variables (for languages similar to ML)
* Bindings
* Types
* Generator for the Haskell programming language

Other than that, there's not much to do other than to refactor this as one (or a few) plugin.

# Building #

The building process is absolutely atrocious. You need to build almost literally everything.

1. `npm run build` to build the library blob itself.
2. `npm run build_headers` to build the headers used by the sample files.
3. `npm run build_toolchain` to build the helper functions for stripping imports in sample files.
4. `npm run build_samples` to build the samples used for the example.