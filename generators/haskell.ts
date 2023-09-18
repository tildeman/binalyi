/**
 * This is awkward.
 * @fileoverview Complete helper functions for generating Haskell for blocks.
 */

import { HaskellGenerator } from "./haskell/haskell_generator";
import * as functions from "./haskell/functions";
import * as lists from "./haskell/lists";
import * as logic from "./haskell/logic";
import * as math from "./haskell/math";
import * as monads from "./haskell/monads";
import * as text from "./haskell/text";
import * as tuples from "./haskell/tuples";
import * as types from "./haskell/types";
import * as variables from "./haskell/variables";

export * from "./haskell/haskell_generator";

/**
 * Haskell code generator instance.
 */
export const haskellGenerator = new HaskellGenerator();

Object.assign(haskellGenerator.forBlock,
    functions, lists, logic, math, monads,
    text, tuples, types, variables);