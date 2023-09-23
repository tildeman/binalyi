// Variables

import { Block } from "blockly";
import { HaskellGenerator } from "./haskell_generator";
import { FNames } from "../../miscellaneous/names";

export function variables_get_functional(block: Block, generator: HaskellGenerator) {
	// Variable getter.
	let code = generator.nameDB_?.getName(
		block.getFieldValue("VAR"),
		FNames.XNameType.VARIABLE
	) || "";
	if ("paramCount_" in block && typeof block.paramCount_ == "number") {
		const args = new Array(block.paramCount_);
		for (let i = 0; i < block.paramCount_; i++) {
			args[i] =
				generator.valueToCode(block, "ADD" + i, generator.ORDER_FUNCTION_PARAM)
				|| "()";
		}
		if (args.length) code += " " + args.join(" ");
		const order =
			block.paramCount_ ? generator.ORDER_FUNCTION_CALL : generator.ORDER_ATOMIC;
		return [code, order];
	}
	return [code, generator.ORDER_ATOMIC];
}

export function variables_set_functional(block: Block, generator: HaskellGenerator) {
	// Variable setter. (Fun fact: once you set it you can't change it)
	const argument0 = generator.valueToCode(block, "EXPR", generator.ORDER_NONE)
		|| "()";
	const varName = generator.nameDB_?.getName(
		block.getFieldValue("VAR"),
		FNames.XNameType.VARIABLE
	) || "";
	if ("paramCount_" in block && typeof block.paramCount_ == "number") {
		const params = new Array(block.paramCount_)
		for (let i = 0; i < block.paramCount_; i++) {
			params[i] =
				generator.valueToCode(block, "ADD" + i, generator.ORDER_FUNCTION_PARAM)
				|| "()";
		}
		const parameterString = block.paramCount_ ? " " + params.join(" ") : ""
		return varName + parameterString + " = " + argument0 + "\n"
	}
	return varName + " = " + argument0 + "\n";
}