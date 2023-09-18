// Text blocks

import { Block } from "blockly";
import { HaskellGenerator } from "./haskell_generator";

export function text(block: Block, generator: HaskellGenerator) {
	// Text value.
	const code = generator.quote_(block.getFieldValue("TEXT"));
	return [code, generator.ORDER_ATOMIC];
}

export function text_multiline(block: Block, generator: HaskellGenerator) {
	// Text value.
	const code = generator.multiline_quote_(block.getFieldValue("TEXT"));
	const order =
		code.indexOf("++") !== -1 ? generator.ORDER_LIST_CONCAT : generator.ORDER_ATOMIC;
	return [code, order];
}

export function text_join(block: Block, generator: HaskellGenerator) {
	if ("itemCount_" in block && typeof block.itemCount_ == "number") {
		switch(block.itemCount_) {
		case 0:
			return ["\"\"", generator.ORDER_ATOMIC];
		case 1:
			const element =
				generator.valueToCode(block, "ADD0", generator.ORDER_NONE) || "\"\"";
			const code = element;
			return [code, generator.ORDER_ATOMIC];
		default:
			const elements: string[] = []
			for (let i = 0; i < block.itemCount_; i++) {
				elements[i] =
					generator.valueToCode(block, "ADD" + i, generator.ORDER_NONE) || "\"\"";
			}
			return [elements.join(" ++ "), generator.ORDER_ADDITIVE];
		}
	}
	return "";
}

export function text_length(block: Block, generator: HaskellGenerator) {
	// Is the string null or array empty?
	const text = generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM) || "[]";
	return ["length " + text, generator.ORDER_FUNCTION_CALL];
}

export function text_isEmpty(block: Block, generator: HaskellGenerator) {
	// Is the string null or array empty?
	const text = generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM) || "[]";
	const code = "length " + text + " == 0";
	return [code, generator.ORDER_RELATIONAL];
}

export function text_indexOf(block: Block, generator: HaskellGenerator) {
	// Search the text for a substring.
	const operator = block.getFieldValue("END") === "FIRST"
		? "findIndexInText" : "findLastIndexInText";
	const substring =
		generator.valueToCode(block, "FIND", generator.ORDER_FUNCTION_PARAM)
		|| "''";
	const text =
		generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM)
		|| "''";

	const helperFunction: string = (operator === "findIndexInText" ? `
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

export function text_charAt(block: Block, generator: HaskellGenerator) {
	// Get letter at index.
	// Note: Until January 2013 this block did not have the WHERE input.
	const where = block.getFieldValue("WHERE") || "FROM_START";
	const textOrder =
		(where === "RANDOM") ? generator.ORDER_NONE : generator.ORDER_MEMBER;
	const text = generator.valueToCode(block, "VALUE", textOrder) || "''";
	let code: string, at: string;
	switch (where) {
	case "FIRST":
		code = text + " !! 0";
		return [code, generator.ORDER_MEMBER];
	case "LAST":
		code = text + " !! (length " + text + " - 1)";
		return [code, generator.ORDER_MEMBER];
	case "FROM_START":
		at = generator.getAdjustedInt(block, "AT");
		code = text + " !! " + at;
		return [code, generator.ORDER_MEMBER];
	case "FROM_END":
		at = generator.getAdjustedInt(block, "AT");
		code = text + " !! (length " + text + " - " + at + ")";
		return [code,generator.ORDER_MEMBER];
	case "RANDOM":
		throw Error("Language implementation does not permit impure values.");
	}
	throw Error("Unhandled option (text_charAt).");
}

export function text_getSubstring(block: Block, generator: HaskellGenerator) {
	// Get substring.
	const where1 = block.getFieldValue("WHERE1");
	const where2 = block.getFieldValue("WHERE2");
	const text =
		generator.valueToCode(block, "STRING", generator.ORDER_FUNCTION_PARAM) || '""';
	let at1: string;
	switch (where1) {
	case "FROM_START":
		at1 = generator.getAdjustedInt(block, "AT1");
		if (at1 == "0") {
			at1 = "";
		}
		break;
	case "FROM_END":
		at1 = generator.getAdjustedInt(block, "AT1");
		break;
	case "FIRST":
		at1 = "";
		break;
	default:
		throw Error("Unhandled option (text_getSubstring)");
	}

	let at2: string;
	switch (where2) {
	case "FROM_START":
		at2 = generator.getAdjustedInt(block, "AT2");
		break;
	case "FROM_END":
		at2 = generator.getAdjustedInt(block, "AT2");
		if (isNaN(parseInt(at2))) {
			generator.definitions_["import_System_IO_Unsafe"] = "import System.IO.Unsafe";
			generator.definitions_["max_bound"] = "maxBound = (maxBound :: Int)";
			at2 += " `unsafePerformIO` maxBound";
		} else if (at2 == "") {
			at2 = "";
		}
		break;
	case "LAST":
		at2 = "";
		break;
	default:
		throw Error("Unhandled option (text_getSubstring)");
	}
	const code = "take " + at2 + " (drop " + at1 + " " + text + ")";
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function text_changeCase(block: Block, generator: HaskellGenerator) {
	// Change capitalization.
	const OPERATORS = {
		"UPPERCASE": "map Data.Char.toUpper",
		"LOWERCASE": "map Data.Char.toLower",
		"TITLECASE": "toTitle"
	};
	let operator = OPERATORS[block.getFieldValue("CASE")];
	const text =
		generator.valueToCode(block, "TEXT", generator.ORDER_FUNCTION_PARAM)
		|| '""';

	if (operator === "toTitle") {
		generator.definitions_["import_datachar"] = "import Data.Char"
		operator = generator.provideFunction_("textToTitleCase", `
textToTitleCase str = unwords $ map capitalizeWord $ words str
where capitalizeWord word = toUpper (head word) : map toLower (tail word)
`.replace(/textToTitleCase/g, generator.FUNCTION_NAME_PLACEHOLDER_));
	}

	const code = operator + " " + text;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function text_trim(block: Block, generator: HaskellGenerator) {
	const OPERATORS = {
		"LEFT": "dropWhile",
		"RIGHT": "Data.List.dropWhileEnd",
		"BOTH": null
	}
	const operator = OPERATORS[block.getFieldValue("MODE")];
	const text = generator.valueToCode(block, "TEXT",
									generator.ORDER_FUNCTION_PARAM) || '""';

	let code: string;
	if (!operator) {
		const trimFunctionName = generator.provideFunction_("trim", `
trim :: String -> String
trim = Data.List.dropWhileEnd Data.Char.isSpace . dropWhile Data.Char.isSpace
`.replace(/trim/g, generator.FUNCTION_NAME_PLACEHOLDER_));
		code = trimFunctionName + " " + text;
	}
	else {
		code = operator + " Data.Char.isSpace " + text;
	}
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function text_count(block: Block, generator: HaskellGenerator) {
	const text = generator.valueToCode(block, "TEXT", generator.ORDER_FUNCTION_PARAM) || '""';
	const sub = generator.valueToCode(block, "SUB", generator.ORDER_FUNCTION_PARAM) || '""';

	const countOccurrences = generator.provideFunction_("countOccurrences", `
countOccurrences :: Eq a => [a] -> [a] -> Int
countOccurrences [] _ = 0
countOccurrences s [] = 0
countOccurrences s@(x:xs) p@(y:ys)
| x == y && xs \`startsWith\` ys = 1 + countOccurrences xs p
| otherwise = countOccurrences xs p
where
	startsWith [] _ = True
	startsWith _ [] = False
	startsWith (a:as) (b:bs) = a == b && as \`startsWith\` bs"
`.replace(/countOccurrences/g, generator.FUNCTION_NAME_PLACEHOLDER_));

	const code = countOccurrences + " " + text + " " + sub;

	return [code, generator.ORDER_FUNCTION_CALL];
}

export function text_reverse(block: Block, generator: HaskellGenerator) {
	const text =
		generator.valueToCode(block, "TEXT", generator.ORDER_FUNCTION_PARAM) || "[]";
	const code = "reverse " + text;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function text_parse(block: Block, generator: HaskellGenerator) {
	const text =
		generator.valueToCode(block, "TEXT", generator.ORDER_FUNCTION_PARAM) || "[]";
	const code = "read " + text;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function text_show(block: Block, generator: HaskellGenerator) {
	const value =
		generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM) || "[]";
	const code = "show " + value;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function text_charops(block: Block, generator: HaskellGenerator) {
	const value = generator.valueToCode(block, "VALUE", generator.ORDER_NONE) || "[]";
	const action = block.getFieldValue("ACTION");
	let code: string, order: number;
	if (action === "ORD") {
		code = "((Data.Char.ord) . head) " + value;
		order = generator.ORDER_FUNCTION_CALL;
	}
	else {
		code = "[(Data.Char.chr) " + value + "]";
		order = generator.ORDER_ATOMIC;
	}
	return [code, order];
}