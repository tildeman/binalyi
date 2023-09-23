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


export function lists_indexOf(block: Block, generator: HaskellGenerator) {
	// Search the text for a substring.
	const operator = block.getFieldValue("END") === "FIRST"
		? "findIndexInList" : "findLastIndexInList";
	const substring =
		generator.valueToCode(block, "FIND", generator.ORDER_FUNCTION_PARAM)
		|| "''";
	const text =
		generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM)
		|| "''";

	const helperFunction: string = (operator === "findIndexInList" ? `
helperFunc :: Eq a => [a] -> [a] -> Int
helperFunc needle haystack =
case [i | (i, 1) <- zip [0..] matches, 1 <- [1 | True]] of
	(x:_) -> x
	[] -> -1
where matches = zipWith (==) haystack (cycle needle)
` : `
helperFunc :: Eq a => [a] -> [a] -> Int
helperFunc needle haystack = 
case [i | (i, 1) <- zip [0..] matches, 1 <- [1 | True]] of
	(x:_) -> x
	[] -> -1
where matches = zipWith (==) (reverse haystack) (cycle needle)
`).replace(/helperFunc/g, generator.FUNCTION_NAME_PLACEHOLDER_);

	const functionName = generator.provideFunction_(operator, helperFunction);
	
	const code = functionName + " " + substring + " " + text;
	if (block.workspace.options.oneBasedIndex) {
		return [code + " + 1", generator.ORDER_ADDITIVE];
	}
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function lists_getSublist(block: Block, generator: HaskellGenerator) {
	// Get substring.
	const where1 = block.getFieldValue("WHERE1");
	const where2 = block.getFieldValue("WHERE2");
	const text =
		generator.valueToCode(block, "STRING", generator.ORDER_FUNCTION_PARAM) || '""';
	let at1: string;
	switch (where1) {
	case "FROM_START":
		at1 = "Letter " + (generator.getAdjustedInt(block, "AT1") || "0");
		break;
	case "FROM_END":
		at1 = "LetterFromEnd " + (generator.getAdjustedInt(block, "AT1") || "0");
		break;
	case "FIRST":
		at1 = "FirstLetter";
		break;
	default:
		throw Error("Unhandled option (text_getSubstring)");
	}

	let at2: string;
	switch (where2) {
	case "FROM_START":
		at2 = "Letter " + (generator.getAdjustedInt(block, "AT2") || "0");
		break;
	case "FROM_END":
		at2 = "LetterFromEnd " + (generator.getAdjustedInt(block, "AT2") || "0");
		break;
	case "LAST":
		at2 = "LastLetter";
		break;
	default:
		throw Error("Unhandled option (text_getSubstring)");
	}
	const getSubstring = generator.provideFunction_("sublistBetween", `
sublistBetween :: [a] -> SublistPosition -> SublistPosition -> [a]
sublistBetween str pos1 pos2 = 
	let 
		len = length str
		idx1 = case pos1 of
			FirstLetter -> 0
			LastLetter -> len - 1
			Letter n -> fromInteger n
			LetterFromEnd n -> len - fromInteger n
		idx2 = case pos2 of
			FirstLetter -> 0
			LastLetter -> len - 1
			Letter n -> fromInteger n
			LetterFromEnd n -> len - fromInteger n
	in 
		if idx1 <= idx2 
		then take (idx2 - idx1 + 1) $ drop idx1 str
		else take (idx1 - idx2 + 1) $ drop idx2 str
	`.replace(/sublistBetween/g, generator.FUNCTION_NAME_PLACEHOLDER_));
	generator.definitions_["data_sublist"] =
		"data SubstringPosition = FirstLetter | LastLetter | Letter Integer | LetterFromEnd Integer";

	const code = `${getSubstring} ${text} (${at1}) (${at2})`;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function lists_length(block: Block, generator: HaskellGenerator) {
	// String or array length.
	const list =
		generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM) || "[]";
	return ["length " + list, generator.ORDER_FUNCTION_CALL];
}

export function lists_sort(block: Block, generator: HaskellGenerator) {
	// Sort an array. Can also sort a string but no one needs that
	const list =
		generator.valueToCode(block, "LIST", generator.ORDER_FUNCTION_PARAM) || "[]";
	const direction = block.getFieldValue("DIRECTION") === "1" ? 1 : -1;
	// TODO: Implement case-insensitive sort
	let code: string;
	if (direction == 1) code = `Data.List.sort ${list}`;
	else code = `(reverse . (Data.List.sort)) ${list}`;
	return [code, generator.ORDER_FUNCTION_CALL];
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

export function lists_split(block: Block, generator: HaskellGenerator) {
	// Block for splitting text into a list, or joining a list into text.
	let input = generator.valueToCode(block, "INPUT", generator.ORDER_FUNCTION_PARAM);
	const delimiter =
		generator.valueToCode(block, "DELIM", generator.ORDER_FUNCTION_PARAM) || '""';
	const mode = block.getFieldValue("MODE");
	let functionName: string;
	if (mode === "SPLIT") {
		if (!input) {
			input = '""';
		}
		functionName = "Data.List.Split.splitOn";
	} else if (mode === "JOIN") {
		if (!input) {
			input = "[]";
		}
		functionName = "Data.List.intercalate";
	} else {
		throw Error("Unknown mode: " + mode);
	}
	const code = `${functionName} ${delimiter} ${input}`;
	return [code, generator.ORDER_FUNCTION_CALL];
	};