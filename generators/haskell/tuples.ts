// Tuples

import { Block } from "blockly";
import { HaskellGenerator } from "./haskell_generator";

export function tuples_create_empty(block: Block, generator: HaskellGenerator) {
	// Create an empty tuple, with the same capabilities as null.
	return ["()", generator.ORDER_ATOMIC];
}

export function tuples_create_with(block: Block, generator: HaskellGenerator) {
	// Create a tuple with any number of elements of any type.
	// 1-element tuples, despite not being a feature in Haskell,
	// may be more intuitive.
	// The implementation is slightly different in the Python generator.
	let itemCount = 0;
	if ("itemCount_" in block && typeof block.itemCount_ == "number") itemCount = block.itemCount_;
	const elements = new Array(itemCount);
	for (let i = 0; i < itemCount; i++) {
		elements[i] =
			generator.valueToCode(block, "ADD" + i, generator.ORDER_NONE) || "()";
	}
	const code = "(" + elements.join(", ") + ")";
	return [code, generator.ORDER_ATOMIC];
}

export function tuples_pair(block: Block, generator: HaskellGenerator) {
	const tuple =
		generator.valueToCode(block, "NAME", generator.ORDER_FUNCTION_PARAM) || "()";
	const action = block.getFieldValue("ACC");
	const func = action === "FIRST" ? "fst " : "snd ";
	const code = func + tuple;
	return [code, generator.ORDER_FUNCTION_CALL];
}
