// Logic blocks

import { Block } from "blockly";
import { HaskellGenerator } from "./haskell_generator";

export function logic_compare(block: Block, generator: HaskellGenerator) {
	// Comparison operator.
	const OPERATORS =
		{"EQ": "==", "NEQ": "/=", "LT": "<", "LTE": "<=", "GT": ">", "GTE": ">="};
	const field_value: "EQ" | "NEQ" | "LT" | "LTE" | "GT" | "GTE" = block.getFieldValue("OP");
	const operator = OPERATORS[field_value];
	const order = generator.ORDER_RELATIONAL;
	const argument0 = generator.valueToCode(block, "A", order) || "0";
	const argument1 = generator.valueToCode(block, "B", order) || "0";
	const code = argument0 + " " + operator + " " + argument1;
	return [code, order];
}

export function logic_operation(block: Block, generator: HaskellGenerator) {
	// Operations "and", "or".
	const operator = (block.getFieldValue("OP") === "AND") ? "&&" : "||";
	const order = (operator === "&&") ? generator.ORDER_LOGICAL_AND :
		generator.ORDER_LOGICAL_OR;
	let argument0 = generator.valueToCode(block, "A", order);
	let argument1 = generator.valueToCode(block, "B", order);
	if (!argument0 && !argument1) {
		// If there are no arguments, then the return value is false.
		argument0 = "False";
		argument1 = "False";
	} else {
		// Single missing arguments have no effect on the return value.
		const defaultArgument = (operator === "&&") ? "True" : "False";
		if (!argument0) {
			argument0 = defaultArgument;
		}
		if (!argument1) {
			argument1 = defaultArgument;
		}
	}
	const code = argument0 + " " + operator + " " + argument1;
	return [code, order];
}

export function logic_negate(block: Block, generator: HaskellGenerator) {
	// Negation.
	const argument0 =
		generator.valueToCode(block, "BOOL", generator.ORDER_FUNCTION_PARAM)
		|| "True";
	const code = "not " + argument0;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function logic_boolean(block: Block, generator: HaskellGenerator) {
	// Boolean values true and false.
	const code = (block.getFieldValue("BOOL") === "TRUE") ? "True" : "False";
	return [code, generator.ORDER_ATOMIC];
}

export function logic_null(block: Block, generator: HaskellGenerator) {
	// Null data type.
	return ["()", generator.ORDER_ATOMIC];
}

export function logic_wildcard(block: Block, generator: HaskellGenerator) {
	// Wild card data type.
	return ["_", generator.ORDER_ATOMIC];
}

export function logic_ternary(block: Block, generator: HaskellGenerator) {
	const value_if =
		generator.valueToCode(block, "IF", generator.ORDER_CONDITIONAL)
		|| "False";
	const value_then =
		generator.valueToCode(block, "THEN", generator.ORDER_CONDITIONAL)
		|| "()";
	const value_else =
		generator.valueToCode(block, "ELSE", generator.ORDER_CONDITIONAL)
		|| "()";
	const code = "if " + value_if + " then " + value_then + " else " + value_else;
	return [code, generator.ORDER_CONDITIONAL];
}

export function logic_cond(block: Block, generator: HaskellGenerator) {
	let n = 0;
	let code: string = "", branchCode: string, conditionCode: string;
	do {
		conditionCode =
			generator.valueToCode(block, "IF" + n, generator.ORDER_CONDITIONAL)
			|| "False";
		branchCode =
			generator.valueToCode(block, "DO" + n, generator.ORDER_CONDITIONAL)
			|| "()";

		conditionCode = generator.prefixLines(
			(n === 0 ? "if " : "else if ") + conditionCode,
			generator.INDENT.repeat(n)
		);
		branchCode = generator.prefixLines(
			"then " + branchCode,
			generator.INDENT.repeat(n + 1)
		);

		code += conditionCode + "\n" + branchCode + "\n";
		n++;
	} while (block.getInput("IF" + n));

	branchCode =
		generator.valueToCode(block, "ELSE", generator.ORDER_CONDITIONAL)
		|| "()";
	branchCode = generator.prefixLines(
		"else " + branchCode,
		generator.INDENT.repeat(n)
	);
	code += branchCode;

	return [code, generator.ORDER_CONDITIONAL];
}

export function logic_patternmatch(block: Block, generator: HaskellGenerator) {
	const pattern =
		generator.valueToCode(block, "PATTERN", generator.ORDER_NONE) || "_";
	let n = 0;
	let code = "case " + pattern + " of", branchCode: string, conditionCode: string;
	do {
		conditionCode =
			generator.valueToCode(block, "CASE" + n, generator.ORDER_NONE)
			|| "_";
		branchCode =
			generator.valueToCode(block, "RESULT" + n, generator.ORDER_NONE)
			|| "()";

		code += "\n" + generator.prefixLines(
			conditionCode + " -> " + branchCode,
			generator.INDENT
		);
		n++;
	} while (block.getInput("CASE" + n));

	if (block.getInput("ELSE")) {
		branchCode =
			generator.valueToCode(block, "ELSE", generator.ORDER_NONE)
			|| "()";
		branchCode = generator.prefixLines(
			"_ -> " + branchCode,
			generator.INDENT
		);
		code += "\n" + branchCode;
	}

	return [code, generator.ORDER_NONE];
}