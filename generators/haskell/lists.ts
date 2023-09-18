// Lists (actual lists not arrays designated as lists)

import { Block } from "blockly";
import { HaskellGenerator } from "./haskell_generator";

export function lists_create_empty(block: Block, generator: HaskellGenerator) {
	// Create an empty list.
	return ["[]", generator.ORDER_ATOMIC];
}

export function lists_create_with(block: Block, generator: HaskellGenerator) {
	// Create a list with any number of elements of any type.
	let itemCount = 0;
	if ("itemCount_" in block && typeof block.itemCount_ == "number") itemCount = block.itemCount_;
	const elements = new Array(itemCount)
	for (let i = 0; i < itemCount; i++) {
		elements[i] =
			generator.valueToCode(block, "ADD" + i, generator.ORDER_NONE) || "()";
	}
	const code = "[" + elements.join(", ") + "]";
	return [code, generator.ORDER_ATOMIC];
}

export function lists_range(block: Block, generator: HaskellGenerator) {
	const start = generator.valueToCode(block, "START", generator.ORDER_NONE) || "0";
	const stop = generator.valueToCode(block, "STOP", generator.ORDER_NONE) || "0";
	const step = generator.valueToCode(block, "STEP", generator.ORDER_ADDITIVE);
	let code = "[" + start;
	if (step) code += ", " + start + " + " + step;
	code += ".." + stop + "]";
	return [code, generator.ORDER_ATOMIC];
}

export function lists_create_infinite(block: Block, generator: HaskellGenerator) {
	const start = generator.valueToCode(block, "START", generator.ORDER_NONE) || "0";
	const step = generator.valueToCode(block, "STEP", generator.ORDER_ADDITIVE);
	let code = "[" + start;
	if (step) code += ", " + start + " + " + step;
	code += "..]";
	return [code, generator.ORDER_ATOMIC];
}

export function lists_cons(block: Block, generator: HaskellGenerator) {
	const value =
		generator.valueToCode(block, "VALUE", generator.ORDER_LIST_APPEND) || "()";
	const list =
		generator.valueToCode(block, "LIST", generator.ORDER_LIST_CONCAT) || "[]";
	const code = value + " : " + list;
	return [code, generator.ORDER_LIST_APPEND];
}

export function lists_repeat(block: Block, generator: HaskellGenerator) {
	// Create a list with one element repeated.
	const item = generator.valueToCode(block, "ITEM", generator.ORDER_NONE) || "None";
	const times =
		generator.valueToCode(block, "NUM", generator.ORDER_NONE) || "0";
	const code = "map (\\_ -> " + item + ") [1.." + times + "]";
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function lists_reverse(block: Block, generator: HaskellGenerator) {
	const list =
		generator.valueToCode(block, "LIST", generator.ORDER_FUNCTION_PARAM) || "[]";
	const code = "reverse " + list;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function lists_join(block: Block, generator: HaskellGenerator) {
	const list1 =
		generator.valueToCode(block, "A", generator.ORDER_LIST_CONCAT) || "[]";
	const list2 =
		generator.valueToCode(block, "B", generator.ORDER_LIST_CONCAT) || "[]";
	const code = list1 + " ++ " + list2;
	return [code, generator.ORDER_LIST_CONCAT];
}

export function list_opad(block: Block, generator: HaskellGenerator) {
	const list =
		generator.valueToCode(block, "NAME", generator.ORDER_FUNCTION_PARAM) || "[]";
	const action = block.getFieldValue("ACC");
	const func = action === "FIRST" ? "head " : "tail ";
	const code = func + list;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function lists_length(block: Block, generator: HaskellGenerator) {
	// String or array length.
	const list =
		generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM) || "[]";
	return ["length " + list, generator.ORDER_FUNCTION_CALL];
}

export function lists_isEmpty(block: Block, generator: HaskellGenerator) {
	// Is the string null or array empty?
	const list = generator.valueToCode(block, "VALUE", generator.ORDER_NONE) || "[]";
	const code = list + " == []";
	return [code, generator.ORDER_RELATIONAL];
}

export function lists_map(block: Block, generator: HaskellGenerator) {
	const func =
		generator.valueToCode(block, "FUNC", generator.ORDER_FUNCTION_PARAM) || "id";
	const list =
		generator.valueToCode(block, "LIST", generator.ORDER_FUNCTION_PARAM) || "[]";
	const code = "map " + func + " " + list;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function lists_filter(block: Block, generator: HaskellGenerator) {
	const func = generator.valueToCode(block, "COND", generator.ORDER_FUNCTION_PARAM)
		|| "(\_ -> true)";
	const list = generator.valueToCode(block, "LIST", generator.ORDER_FUNCTION_PARAM)
		|| "[]";
	const code = "filter " + func + " " + list;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function lists_fold(block: Block, generator: HaskellGenerator) {
	const func = generator.valueToCode(block, "FUNC", generator.ORDER_FUNCTION_PARAM)
		|| "(+)";
	const init = generator.valueToCode(block, "INIT", generator.ORDER_FUNCTION_PARAM)
		|| "0";
	const list = generator.valueToCode(block, "LIST", generator.ORDER_FUNCTION_PARAM)
		|| "[]";
	const direction = block.getFieldValue("DIRECTION")[0].toLowerCase();
	const code = "fold" + direction + " " + func + " " + init + " " + list;
	return [code, generator.ORDER_FUNCTION_CALL];
}
