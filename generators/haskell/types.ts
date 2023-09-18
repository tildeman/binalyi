// Types
// TODO: Find a way to fix the naming bug

import { Block } from "blockly";
import { HaskellGenerator } from "./haskell_generator";
import { FNames } from "../../miscellaneous/names";

export function types_primitive(block: Block, generator: HaskellGenerator) {
	// Primitives: Int, Char, Bool, Double.
	return [block.getFieldValue("TYPE"), generator.ORDER_ATOMIC];
}

export function types_list(block: Block, generator: HaskellGenerator) {
	// List of a type.
	const subtype = generator.valueToCode(block, "SUBTYPE", generator.ORDER_NONE);
	const code = "[" + subtype + "]";
	return [code, generator.ORDER_ATOMIC];
}

export function types_tuple(block: Block, generator: HaskellGenerator) {
	// Create a tuple type with any number of elements.
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

export function types_placeholder(block: Block, generator: HaskellGenerator) {
	const name = block.getFieldValue("NAME");
	return [name, generator.ORDER_ATOMIC];
}

export function types_cast(block: Block, generator: HaskellGenerator) {
	const value = generator.valueToCode(block, "VALUE", generator.ORDER_NONE) || "()";
	// Untested code
	const blockType = generator.valueToCode(block, "TYPE", generator.ORDER_NONE)
		|| "()";
	return [value + " :: " + blockType, generator.ORDER_ATOMIC];
}

export function types_type(block: Block, generator: HaskellGenerator) {
	let blockTypeName = "";
	if ("typeName_" in block && typeof block.typeName_ == "string") blockTypeName = block.typeName_;
	const typeName = generator.nameDB_?.getName(
		blockTypeName,
		FNames.XNameType.TYPE
	);
	const elements: string[] = [];
	let i = 0;
	while (block.getInput("DATA" + i)) {
		elements.push(
			generator.valueToCode(
				block,
				"DATA" + i,
				generator.ORDER_FUNCTION_PARAM
			) || "()"
		);
		i++;
	}

	let code = typeName || "";
	let order = generator.ORDER_ATOMIC;
	if (elements.length) {
		code += " " + elements.join(" ");
		order = generator.ORDER_FUNCTION_CALL;
	}
	
	return [code, order];
}

export function types_dc_def(block: Block, generator: HaskellGenerator) {
	const blockType = generator.nameDB_?.getName(
		block.getFieldValue("TYPE"),
		FNames.XNameType.TYPE
	) || "";
	if (!generator.typedefs[blockType]) generator.typedefs[blockType] = [];

	const dataConsName = generator.nameDB_?.getName(
		block.getFieldValue("NAME"),
		FNames.XNameType.DATACONS
	) || "";
	let itemCount = 0;
	if ("itemCount_" in block && typeof block.itemCount_ == "number") itemCount = block.itemCount_;
	const elements = new Array(itemCount);
	elements[0] = dataConsName;
	for (let i = 0; i < itemCount; i++) {
		elements[i + 1] =
			generator.valueToCode(block, "DATA" + i, generator.ORDER_NONE) || "()";
	}

	generator.typedefs[blockType].push(
		elements.join(" ")
	);
	return "";
}

export function types_dc_get(block: Block, generator: HaskellGenerator) {
	let dcNameZ = "";
	if ("dcName_" in block && typeof block.dcName_ == "string") dcNameZ = block.dcName_;
	const dcName = generator.nameDB_?.getName(
		dcNameZ,
		FNames.XNameType.DATACONS
	);
	const elements: string[] = [];
	let i = 0;
	while (block.getInput("DATA" + i)) {
		elements.push(
			generator.valueToCode(
				block,
				"DATA" + i,
				generator.ORDER_FUNCTION_PARAM
			) || "()"
		);
		i++;
	}
	
	let code = dcName || "";
	let order = generator.ORDER_ATOMIC;
	if (elements.length) {
		code += " " + elements.join(" ");
		order = generator.ORDER_FUNCTION_CALL;
	}
	
	return [code, order];
}
