// I/O operations & monads

import { Block } from "blockly";
import { HaskellGenerator } from "./haskell_generator";

export function monad_print(block: Block, generator: HaskellGenerator) {
	// Print the representation of a value
	const value =
		generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM) || "0";
	return ["print " + value, generator.ORDER_FUNCTION_CALL];
}

export function monad_putstr(block: Block, generator: HaskellGenerator) {
	// Output the specified string
	const value =
		generator.valueToCode(block, "STR", generator.ORDER_FUNCTION_PARAM) || "\"\"";
	const action = "putStr" + (block.getFieldValue("NEWLINE") == "TRUE" ? "Ln": "");
	return [action + " " + value, generator.ORDER_FUNCTION_CALL];
}

export function monad_prompt(block: Block, generator: HaskellGenerator) {
	return ["getLine", generator.ORDER_ATOMIC];
}

// Monads

export function monad_return(block: Block, generator: HaskellGenerator) {
	// Make a value mOnAdIc
	const value =
		generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM) || "()";
	return ["return " + value, generator.ORDER_FUNCTION_CALL];
}

export function monad_fail(block: Block, generator: HaskellGenerator) {
	// Make a monad fail
	const value =
		generator.valueToCode(block, "ERR", generator.ORDER_FUNCTION_PARAM) || "\"\""
	return ["fail " + value, generator.ORDER_FUNCTION_CALL]
}

export function monad_operations(block: Block, generator: HaskellGenerator) {
	// Basic monadic operators, and power.
	const OPERATORS = {
		"BIND": " >>= ",
		"THEN": " >> "
	};
	const operator = OPERATORS[block.getFieldValue("OP")];
	const order = generator.ORDER_MONAD_OPS;
	const argument0 =
		generator.valueToCode(block, "A", order) || "return ()";
	const argument1 =
		generator.valueToCode(block, "B", order) || "print";
	const code = argument0 + operator + argument1;
	return [code, order];
}

export function monad_bindings(block: Block, generator: HaskellGenerator) {
	// Basic monadic operators, and power.
	const OPERATORS = {
		"DOLET": ["", " <- "],
		"LET": ["let ", " = "]
	};
	const tuple = OPERATORS[block.getFieldValue("OP")];
	const prefix = tuple[0];
	const operator = tuple[1];
	const order = generator.ORDER_NONE;
	const argument0 =
		generator.valueToCode(block, "A", order) || "_";
	const argument1 =
		generator.valueToCode(block, "B", order) || "getLine";
	const code = prefix + argument0 + operator + argument1 + "\n";
	return code;
}