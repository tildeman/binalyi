import * as Blockly from "blockly"
import { FNames } from "../stuff/names"

/**
 * The generator for Haskell uses significant portions of code from the
 * built-in Python and JavaScript generators. However, as a purely
 * functional programming language, the semantics of the blocks here
 * are designed significantly differently to reflect the paradigm.
 */

export const Haskell = new Blockly.Generator("Haskell")
// TODO: Split this monster into several files

// Order of operations enumerations
Haskell.ORDER_ATOMIC = 0
Haskell.ORDER_FUNCTION_PARAM = 1
Haskell.ORDER_FUNCTION_CALL = 2
Haskell.ORDER_COMPOSITION = 3
Haskell.ORDER_MEMBER = 4
Haskell.ORDER_EXPONENTIATION = 5
Haskell.ORDER_MULTIPLICATIVE = 6
Haskell.ORDER_ADDITIVE = 7
Haskell.ORDER_UNARY_SIGN = 8
Haskell.ORDER_LIST_APPEND = 9
Haskell.ORDER_LIST_CONCAT = 10
Haskell.ORDER_RELATIONAL = 11
Haskell.ORDER_LOGICAL_AND = 13
Haskell.ORDER_LOGICAL_OR = 14
Haskell.ORDER_CONSTRUCTOR = 15
Haskell.ORDER_MONAD_OPS = 16
Haskell.ORDER_APPLICATION = 17
Haskell.ORDER_CONDITIONAL = 18
Haskell.ORDER_NONE = +84 // Superficial purposes.

// Haskell.addReservedWords()


// Initialization

Haskell.isInitialized = false

Haskell.init = function(workspace) {
	// Call Blockly.CodeGenerator's init.
	Object.getPrototypeOf(this).init.call(this)

	if (!this.nameDB_) {
		this.nameDB_ = new FNames(this.RESERVED_WORDS_)
	}
	else {
		this.nameDB_.reset()
	}

	this.nameDB_.setVariableMap(workspace.getVariableMap())
	this.nameDB_.populateVariables(workspace)
	this.nameDB_.populateTypes(workspace)

	this.typedefs = Object.create(null)

	this.isInitialized = true
}

Haskell.finish = function(code) {
	const type_definitions = []
	const definitions = Object.values(this.definitions_)
	for (let typeName in this.typedefs) {
		const definitions = this.typedefs[typeName]
		type_definitions.push("data " + typeName + " = " + definitions.join(" | "))
	}
	this.isInitialized = false

	this.nameDB_.reset()
	const allDefs = definitions.join("\n") + type_definitions.join("\n") + "\n\n"
	return allDefs + code
}


// Miscellaneous functions

Haskell.quote_ = function(text) {
	return '"' + text + '"'
}

Haskell.multiline_quote_ = function(string) {
  const lines = string.split(/\n/g).map(this.quote_);
  // Join with the following, plus a newline:
  // ++ "\n" ++
  return lines.join(' ++ "\\n" ++ \n');
}

Haskell.getAdjustedInt = function(block, input) {
	return Haskell.valueToCode(block, input, Haskell.ORDER_NONE)
}

// Logic blocks

Haskell["logic_compare"] = function(block) {
	// Comparison operator.
	const OPERATORS =
		  {"EQ": "==", "NEQ": "/=", "LT": "<", "LTE": "<=", "GT": ">", "GTE": ">="}
	const operator = OPERATORS[block.getFieldValue("OP")]
	const order = Haskell.ORDER_RELATIONAL
	const argument0 = Haskell.valueToCode(block, "A", order) || "0"
	const argument1 = Haskell.valueToCode(block, "B", order) || "0"
	const code = argument0 + " " + operator + " " + argument1
	return [code, order]
}

Haskell["logic_operation"] = function(block) {
	// Operations "and", "or".
	const operator = (block.getFieldValue("OP") === "AND") ? "&&" : "||"
	const order = (operator === "&&") ? Haskell.ORDER_LOGICAL_AND :
		  Haskell.ORDER_LOGICAL_OR
	let argument0 = Haskell.valueToCode(block, "A", order)
	let argument1 = Haskell.valueToCode(block, "B", order)
	if (!argument0 && !argument1) {
		// If there are no arguments, then the return value is false.
		argument0 = "False"
		argument1 = "False"
	} else {
		// Single missing arguments have no effect on the return value.
		const defaultArgument = (operator === "&&") ? "True" : "False"
		if (!argument0) {
			argument0 = defaultArgument
		}
		if (!argument1) {
			argument1 = defaultArgument
		}
	}
	const code = argument0 + " " + operator + " " + argument1
	return [code, order]
}

Haskell["logic_negate"] = function(block) {
	// Negation.
	const argument0 =
		  Haskell.valueToCode(block, "BOOL", Haskell.ORDER_FUNCTION_PARAM)
		  || "True"
	const code = "not " + argument0
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["logic_boolean"] = function(block) {
	// Boolean values true and false.
	const code = (block.getFieldValue("BOOL") === "TRUE") ? "True" : "False"
	return [code, Haskell.ORDER_ATOMIC]
}

Haskell["logic_null"] = function(block) {
	// Null data type.
	return ["()", Haskell.ORDER_ATOMIC]
}

Haskell["logic_wildcard"] = function(block) {
	// Wild card data type.
	return ["_", Haskell.ORDER_ATOMIC]
}

Haskell["logic_ternary"] = function(block) {
	const value_if =
		  Haskell.valueToCode(block, "IF", Haskell.ORDER_CONDITIONAL)
		  || "False"
	const value_then =
		  Haskell.valueToCode(block, "THEN", Haskell.ORDER_CONDITIONAL)
		  || "()"
	const value_else =
		  Haskell.valueToCode(block, "ELSE", Haskell.ORDER_CONDITIONAL)
		  || "()"
	const code = "if " + value_if + " then " + value_then + " else " + value_else
	return [code, Haskell.ORDER_CONDITIONAL]
}

Haskell["logic_cond"] = function(block) {
	let n = 0
	let code = "", branchCode, conditionCode
	do {
		conditionCode =
			Haskell.valueToCode(block, "IF" + n, Haskell.ORDER_CONDITIONAL)
			|| "False"
		branchCode =
			Haskell.valueToCode(block, "DO" + n, Haskell.ORDER_CONDITIONAL)
			|| "()"

		conditionCode = Haskell.prefixLines(
			(n === 0 ? "if " : "else if ") + conditionCode,
			Haskell.INDENT.repeat(n)
		)
		branchCode = Haskell.prefixLines(
			"then " + branchCode,
			Haskell.INDENT.repeat(n + 1)
		)

		code += conditionCode + "\n" + branchCode + "\n"
		n++
	} while (block.getInput("IF" + n))

	branchCode =
		Haskell.valueToCode(block, "ELSE", Haskell.ORDER_CONDITIONAL)
		|| "()"
	branchCode = Haskell.prefixLines(
		"else " + branchCode,
		Haskell.INDENT.repeat(n)
	)
	code += branchCode

	return [code, Haskell.ORDER_CONDITIONAL]
}

Haskell["logic_patternmatch"] = function(block) {
	const pattern =
		  Haskell.valueToCode(block, "PATTERN", Haskell.ORDER_NONE) || "_"
	let n = 0
	let code = "case " + pattern + " of", branchCode, conditionCode
	do {
		conditionCode =
			Haskell.valueToCode(block, "CASE" + n, Haskell.ORDER_NONE)
			|| "_"
		branchCode =
			Haskell.valueToCode(block, "RESULT" + n, Haskell.ORDER_NONE)
			|| "()"

		code += "\n" + Haskell.prefixLines(
			conditionCode + " -> " + branchCode,
			Haskell.INDENT
		)
		n++
	} while (block.getInput("CASE" + n))

	if (this.getInput("ELSE")) {
		branchCode =
			Haskell.valueToCode(block, "ELSE", Haskell.ORDER_NONE)
			|| "()"
		branchCode = Haskell.prefixLines(
			"_ -> " + branchCode,
			Haskell.INDENT
		)
		code += "\n" + branchCode
	}

	return [code, Haskell.ORDER_NONE]
}


// Text blocks

Haskell["text"] = function(block) {
  // Text value.
  const code = Haskell.quote_(block.getFieldValue("TEXT"))
  return [code, Haskell.ORDER_ATOMIC]
}

Haskell["text_multiline"] = function(block) {
  // Text value.
  const code = Haskell.multiline_quote_(block.getFieldValue("TEXT"))
  const order =
	  code.indexOf("++") !== -1 ? Haskell.ORDER_LIST_CONCAT : Haskell.ORDER_ATOMIC
  return [code, order]
}

Haskell["text_join"] = function(block) {
	switch(block.itemCount_) {
	case 0:
		return ["\"\"", Haskell.ORDER_ATOMIC]
	case 1:
		const element =
			Haskell.valueToCode(block, "ADD0", Haskell.ORDER_NONE) || "\"\""
		const code = element
		return [code, Haskell.ORDER_ATOMIC]
	default:
		const elements = []
		for (let i = 0; i < block.itemCount_; i++) {
			elements[i] =
				Haskell.valueToCode(block, "ADD" + i, Haskell.ORDER_NONE) || "\"\""
		}
		return [elements.join(" ++ "), Haskell.ORDER_ADDITIVE]
		
	}
	return ""
}

Haskell["text_length"] = function(block) {
	// Is the string null or array empty?
	const text = Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	return ["length " + text, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["text_isEmpty"] = function(block) {
	// Is the string null or array empty?
	const text = Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "length " + text + " == 0"
	return [code, Haskell.ORDER_RELATIONAL]
}

Haskell["text_indexOf"] = function(block) {
	// Search the text for a substring.
	const operator = block.getFieldValue("END") === "FIRST"
		  ? "findIndexInText" : "findLastIndexInText"
	const substring =
		  Haskell.valueToCode(block, "FIND", Haskell.ORDER_FUNCTION_PARAM)
		  || "''"
	const text =
		  Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM)
		  || "''"

	const helperFunction = (operator === "findIndexInText" ? `
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
`).replaceAll("helperFunc", Haskell.FUNCTION_NAME_PLACEHOLDER_)

	const functionName = Haskell.provideFunction_(operator, helperFunction)
	
	const code = functionName + " " + substring + " " + text
	if (block.workspace.options.oneBasedIndex) {
		return [code + " + 1", Haskell.ORDER_ADDITIVE]
	}
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["text_charAt"] = function(block) {
	// Get letter at index.
	// Note: Until January 2013 this block did not have the WHERE input.
	const where = block.getFieldValue("WHERE") || "FROM_START"
	const textOrder =
		  (where === "RANDOM") ? Haskell.ORDER_NONE : Haskell.ORDER_MEMBER
	const text = Haskell.valueToCode(block, "VALUE", textOrder) || "''"
	switch (where) {
	case "FIRST": {
		const code = text + " !! 0"
		return [code, Haskell.ORDER_MEMBER]
	}
	case "LAST": {
		const code = text + " !! (length " + text + " - 1)"
		return [code, Haskell.ORDER_MEMBER]
	}
	case "FROM_START": {
		const at = Haskell.getAdjustedInt(block, "AT")
		const code = text + " !! " + at
		return [code, Haskell.ORDER_MEMBER]
	}
	case "FROM_END": {
		const at = Haskell.getAdjustedInt(block, "AT", 1, true)
		const code = text + " !! (length " + text + " - " + at + ")"
	  return [code,Haskell.ORDER_MEMBER]
	}
	case "RANDOM": {
		throw Error("Unhandled option (text_charAt).")
	}
	}
	throw Error("Unhandled option (text_charAt).")
}

Haskell['text_changeCase'] = function(block) {
	// Change capitalization.
	const OPERATORS = {
		'UPPERCASE': 'map Data.Char.toUpper',
		'LOWERCASE': 'map Data.Char.toLower',
		'TITLECASE': 'toTitle'
	};
	let operator = OPERATORS[block.getFieldValue('CASE')];
	const text = Haskell.valueToCode(block, 'TEXT', Haskell.ORDER_FUNCTION_PARAM)
		  || "''";

	if (operator === 'toTitle') {
		operator = Haskell.provideFunction_('toTitle', `
import Data.Char (toUpper, toLower, isSpace)

toTitle :: String -> String
toTitle [] = []
toTitle (x:xs) = toUpper x : map toLower (takeWhile (not . isSpace) xs) ++ (toTitle $ dropWhile (not . isSpace) xs)
`.replaceAll("toTitle", Haskell.FUNCTION_NAME_PLACEHOLDER_)
		);
	}
	
	const code = operator + ' ' + text;
	return [code, Haskell.ORDER_FUNCTION_CALL];
};

Haskell["text_reverse"] = function(block) {
	const text =
		  Haskell.valueToCode(block, "TEXT", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "reverse " + text
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["text_parse"] = function(block) {
	const text =
		  Haskell.valueToCode(block, "TEXT", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "read " + text
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["text_show"] = function(block) {
	const value =
		  Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "show " + value
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["text_charops"] = function(block) {
	const value = Haskell.valueToCode(block, "VALUE", Haskell.ORDER_NONE) || "[]"
	const action = block.getFieldValue("ACTION")
	let code, order
	if (action === "ORD") {
		code = "((Data.Char.ord) . head) " + value
		order = Haskell.ORDER_FUNCTION_CALL
	}
	else {
		code = "[(Data.Char.chr) " + value + "]"
		order = Haskell.ORDER_ATOMIC
	}
	return [code, order]
}

// Lists (actual lists not arrays designated as lists)

Haskell["lists_create_empty"] = function(block) {
	// Create an empty list.
	return ["[]", Haskell.ORDER_ATOMIC]
}

Haskell["lists_create_with"] = function(block) {
	// Create a list with any number of elements of any type.
	const elements = new Array(block.itemCount_)
	for (let i = 0; i < block.itemCount_; i++) {
		elements[i] =
			Haskell.valueToCode(block, "ADD" + i, Haskell.ORDER_NONE) || "()"
	}
	const code = "[" + elements.join(", ") + "]"
	return [code, Haskell.ORDER_ATOMIC]
}

Haskell["lists_range"] = function(block) {
	const start = Haskell.valueToCode(block, "START", Haskell.ORDER_NONE) || "0"
	const stop = Haskell.valueToCode(block, "STOP", Haskell.ORDER_NONE) || "0"
	const step = Haskell.valueToCode(block, "STEP", Haskell.ORDER_ADDITIVE)
	let code = "[" + start
	if (step) code += ", " + start + " + " + step
	code += ".." + stop + "]"
	return [code, Haskell.ORDER_ATOMIC]
}

Haskell["lists_create_infinite"] = function(block) {
	const start = Haskell.valueToCode(block, "START", Haskell.ORDER_NONE) || "0"
	const step = Haskell.valueToCode(block, "STEP", Haskell.ORDER_ADDITIVE)
	let code = "[" + start
	if (step) code += ", " + start + " + " + step
	code += "..]"
	return [code, Haskell.ORDER_ATOMIC]
}

Haskell["lists_cons"] = function(block) {
	const value =
		  Haskell.valueToCode(block, "VALUE", Haskell.ORDER_LIST_APPEND) || "()"
	const list =
		  Haskell.valueToCode(block, "LIST", Haskell.ORDER_LIST_CONCAT) || "[]"
	const code = value + " : " + list
	return [code, Haskell.ORDER_LIST_APPEND]
}

Haskell["lists_repeat"] = function(block) {
	// Create a list with one element repeated.
	const item = Haskell.valueToCode(block, "ITEM", Haskell.ORDER_NONE) || "None"
	const times =
		  Haskell.valueToCode(block, "NUM", Haskell.ORDER_NONE) || "0"
	const code = "map (\\_ -> " + item + ") [1.." + times + "]"
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_reverse"] = function(block) {
	const list =
		  Haskell.valueToCode(block, "LIST", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "reverse " + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_join"] = function(block) {
	const list1 =
		  Haskell.valueToCode(block, "A", Haskell.ORDER_LIST_CONCAT) || "[]"
	const list2 =
		  Haskell.valueToCode(block, "B", Haskell.ORDER_LIST_CONCAT) || "[]"
	const code = list1 + " ++ " + list2
	return [code, Haskell.ORDER_LIST_CONCAT]
}

Haskell["list_opad"] = function(block) {
	const list =
		  Haskell.valueToCode(block, "NAME", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const action = block.getFieldValue("ACC")
	const func = action === "FIRST" ? "head " : "tail "
	const code = func + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_length"] = function(block) {
	// String or array length.
	const list =
		  Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	return ["length " + list, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_isEmpty"] = function(block) {
	// Is the string null or array empty?
	const list = Haskell.valueToCode(block, "VALUE", Haskell.ORDER_NONE) || "[]"
	const code = list + " == []"
	return [code, Haskell.ORDER_RELATIONAL]
}

Haskell["lists_map"] = function(block) {
	const func =
		  Haskell.valueToCode(block, "FUNC", Haskell.ORDER_FUNCTION_PARAM) || "id"
	const list =
		  Haskell.valueToCode(block, "LIST", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "map " + func + " " + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_filter"] = function(block) {
	const func = Haskell.valueToCode(block, "COND", Haskell.ORDER_FUNCTION_PARAM)
		  || "(\_ -> true)"
	const list = Haskell.valueToCode(block, "LIST", Haskell.ORDER_FUNCTION_PARAM)
		  || "[]"
	const code = "filter " + func + " " + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_fold"] = function(block) {
	const func = Haskell.valueToCode(block, "FUNC", Haskell.ORDER_FUNCTION_PARAM)
		  || "(+)"
	const init = Haskell.valueToCode(block, "INIT", Haskell.ORDER_FUNCTION_PARAM)
		  || "0"
	const list = Haskell.valueToCode(block, "LIST", Haskell.ORDER_FUNCTION_PARAM)
		  || "[]"
	const direction = block.getFieldValue("DIRECTION")[0].toLowerCase()
	const code = "fold" + direction + " " + func + " " + init + " " + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

// Math blocks

Haskell["math_number"] = function(block) {
	// Numeric value.
	let code = Number(block.getFieldValue("NUM"))
	let order
	if (code === Infinity) {
		code = "1 / 0"
		order = Haskell.ORDER_MULTIPLICATIVE
	} else if (code === -Infinity) {
		code = "(-1) / 0"
		order = Haskell.ORDER_MULTIPLICATIVE
	} else {
		// Sadly there is no easy way to determine
		// when unaries can go without parentheses
		order = code < 0 ? Haskell.ORDER_UNARY_SIGN : Haskell.ORDER_ATOMIC
	}
	return [code ? code : "0", order]
}

Haskell["math_arithmetic"] = function(block) {
	// Basic arithmetic operators, and power.
	const OPERATORS = {
		"ADD": [" + ", Haskell.ORDER_ADDITIVE],
		"MINUS": [" - ", Haskell.ORDER_ADDITIVE],
		"MULTIPLY": [" * ", Haskell.ORDER_MULTIPLICATIVE],
		"DIVIDE": [" / ", Haskell.ORDER_MULTIPLICATIVE],
		"POWER": [" ** ", Haskell.ORDER_EXPONENTIATION],
	}
	const tuple = OPERATORS[block.getFieldValue("OP")]
	const operator = tuple[0]
	const order = tuple[1]
	const argument0 = Haskell.valueToCode(block, "A", order) || "0"
	const argument1 = Haskell.valueToCode(block, "B", order) || "0"
	const code = argument0 + operator + argument1
	return [code, order]
	// We'll get back to this later. The exponentiation operator is unpleasant
	// to say the least. There are two versions of it here:
	//  1. (^): Works on integers
	//  2. (**): Works on floating-point numbers
	// TODO: Implement a custom operator for both purposes.
}

Haskell["math_single"] = function(block) {
	// Math operators with single operand.
	const operator = block.getFieldValue("OP")
	let code
	let arg
	if (operator === "SIN" || operator === "COS" || operator === "TAN") {
		arg = Haskell.valueToCode(block, "NUM", Haskell.ORDER_MULTIPLICATIVE)
			|| "0"
	} else {
		arg = Haskell.valueToCode(block, "NUM", Haskell.ORDER_FUNCTION_PARAM)
			|| "0"
	}
	// First, handle cases which generate values that don't need parentheses
	// wrapping the code.
	switch (operator) {
	case "ABS":
		code = "abs " + arg
		break
	case "NEG":
		code = "(0-) " + arg
		break
	case "ROOT":
		code = "sqrt " + arg
		break
	case "LN":
		code = "log " + arg
		break
	case "LOG10":
		code = "(\\x -> log x / log 10) " + arg
		break
	case "EXP":
		code = "exp " + arg
		break
	case "POW10":
		code = "(10**) " + arg
		break
	case "ROUND":
		code = "round " + arg
		break
	case "ROUNDUP":
		code = "ceiling " + arg
		break
	case "ROUNDDOWN":
		code = "floor " + arg
		break
	case "SIN":
		code = "sin (" + arg + " / 180.0 * math.pi)"
		break
	case "COS":
		code = "cos (" + arg + " / 180.0 * math.pi)"
		break
	case "TAN":
		code = "tan (" + arg + " / 180.0 * math.pi)"
		break
	}
	if (code) {
		return [code, Haskell.ORDER_FUNCTION_CALL]
	}
	// Second, handle cases which generate values that may need parentheses
	// wrapping the code.
	switch (operator) {
	case "ASIN":
		code = "asin " + arg + " / math.pi * 180"
		break
	case "ACOS":
		code = "acos " + arg + " / math.pi * 180"
		break
	case "ATAN":
		code = "atan " + arg + " / math.pi * 180"
		break
	default:
		throw Error("Unknown math operator: " + operator)
	}
	return [code, Haskell.ORDER_MULTIPLICATIVE]
}

Haskell["math_constant"] = function(block) {
	// Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
	const CONSTANTS = {
		"PI": ["pi", Haskell.ORDER_MEMBER],
		"E": ["exp 1", Haskell.ORDER_FUNCTION_CALL],
		"GOLDEN_RATIO": ["(1 + sqrt 5) / 2", Haskell.ORDER_MULTIPLICATIVE],
		"SQRT2": ["sqrt 2", Haskell.ORDER_FUNCTION_CALL],
		"SQRT1_2": ["sqrt (1.0 / 2)", Haskell.ORDER_FUNCTION_CALL],
		"INFINITY": ["1 / 0", Haskell.ORDER_MULTIPLICATIVE],
	}
	const constant = block.getFieldValue("CONSTANT")
	return CONSTANTS[constant]
}

Haskell["math_number_property"] = function(block) {
	const PROPERTIES = {
		"EVEN": [" `mod` 2 == 0", Haskell.ORDER_MULTIPLICATIVE, Haskell.ORDER_RELATIONAL],
		"ODD": [" `mod` 2 /= 0", Haskell.ORDER_MULTIPLICATIVE, Haskell.ORDER_RELATIONAL],
		"WHOLE": [null, Haskell.ORDER_RELATIONAL, Haskell.ORDER_RELATIONAL],
		"POSTITIVE": [" > 0", Haskell.ORDER_RELATIONAL, Haskell.ORDER_RELATIONAL],
		"NEGATIVE": [" < 0", Haskell.ORDER_RELATIONAL, Haskell.ORDER_RELATIONAL],
		"DIVISIBLE_BY": [null, Haskell.ORDER_MULTIPLICATIVE,
						 Haskell.ORDER_RELATIONAL],
		"PRIME": [null, Haskell.ORDER_FUNCTION_PARAM, Haskell.ORDER_FUNCTION_CALL]
	}
	const dropdownProperty = block.getFieldValue("PROPERTY")
	const [suffix, inputOrder, outputOrder] = PROPERTIES[dropdownProperty]
	const numberToCheck = Haskell.valueToCode(block, "NUMBER_TO_CHECK", inputOrder)
		  || "0"
	let code
	switch (dropdownProperty) {
	case "PRIME":
		const functionName = Haskell.provideFunction_("math_isPrime", `
${Haskell.FUNCTION_NAME_PLACEHOLDER_} n = let
  isTwoOrThree = n == 2 || n == 3
  isInvalid = n <= 1 || n \`mod\` 1 /= 0 || n \`mod\` 2 == 0 || n \`mod\` 3 == 0
  checkRange = all (\\x -> n \`mod\` (x - 1) /= 0 && n \`mod\` (x + 1) /= 0) [6, 12..(floor $ sqrt $ fromIntegral n) + 1] in if isTwoOrThree
    then True
    else if isInvalid
      then False
      else checkRange
`)
		code = functionName + " " + numberToCheck
		break
	case "DIVISIBLE_BY":
		const divisor = Haskell.valueToCode(block, "DIVISOR",
											Haskell.ORDER_MULTIPLICATIVE) || "1"
		code = numberToCheck + " % " + divisor + " == 0"
		break
	case "WHOLE":
		code = numberToCheck + " == fromInteger (round " + numberToCheck + ")"
		break
	default:
		code = numberToCheck + suffix
	}
	return [code, outputOrder]
}

// Rounding functions have a single operand.
Haskell["math_round"] = Haskell["math_single"]
// Trigonometry functions have a single operand.
Haskell["math_trig"] = Haskell["math_single"]

Haskell["math_modulo"] = function(block) {
	// Remainder computation.
	const argument0 =
		  Haskell.valueToCode(block, "DIVIDEND", Haskell.ORDER_FUNCTION_PARAM) || "0"
	const argument1 =
	  Haskell.valueToCode(block, "DIVISOR", Haskell.ORDER_FUNCTION_PARAM) || "1"
	const code = "mod " + argument0 + " " + argument1
	return [code, Haskell.ORDER_MULTIPLICATIVE]
}

Haskell["math_constrain"] = function(block) {
	// Constrain a number between two limits.
	const argument0 =
		  Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM) || "0"
	const argument1 =
		  Haskell.valueToCode(block, "LOW", Haskell.ORDER_FUNCTION_PARAM) || "0"
	const argument2 =
		  Haskell.valueToCode(block, "HIGH", Haskell.ORDER_FUNCTION_PARAM) || "(1 / 0)"
	const code =
		  "min (max " + argument0 + " " + argument1 + ") " + argument2
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["math_atan2"] = function(block) {
	// Arctangent of point (X, Y) in degrees from -180 to 180.
	const argument0 = Haskell.valueToCode(block, "X", Haskell.ORDER_NONE) || "1"
	const argument1 = Haskell.valueToCode(block, "Y", Haskell.ORDER_NONE) || "0"
	return [
		"atan2 " + argument1 + " " + argument0 + " / pi * 180",
		Haskell.ORDER_MULTIPLICATIVE
	]
}

// Tuples

Haskell["tuples_create_empty"] = function(block) {
	// Create an empty tuple, with the same capabilities as null.
	return ["()", Haskell.ORDER_ATOMIC]
}

Haskell["tuples_create_with"] = function(block) {
	// Create a tuple with any number of elements of any type.
	// 1-element tuples, despite not being a feature in Haskell,
	// may be more intuitive.
	// The implementation is slightly different in the Python generator.
	const elements = new Array(block.itemCount_)
	for (let i = 0; i < block.itemCount_; i++) {
		elements[i] =
			Haskell.valueToCode(block, "ADD" + i, Haskell.ORDER_NONE) || "()"
	}
	const code = "(" + elements.join(", ") + ")"
	return [code, Haskell.ORDER_ATOMIC]
}

Haskell["tuples_pair"] = function(block) {
	const list =
		  Haskell.valueToCode(block, "NAME", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const action = block.getFieldValue("ACC")
	const func = action === "FIRST" ? "fst " : "snd "
	const code = func + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

// Blocks for functions

Haskell["function_compose"] = function(block) {
	const func1 = Haskell.valueToCode(block, "A", Haskell.ORDER_COMPOSITION)
		  || "id"
	const func2 = Haskell.valueToCode(block, "B", Haskell.ORDER_COMPOSITION)
		  || "id"
	const code = func1 + " . " + func2
	return [code, Haskell.ORDER_COMPOSITION]
}

Haskell["function_apply"] = function(block) {
	const func1 = Haskell.valueToCode(block, "A", Haskell.ORDER_APPLICATION)
		  || "id"
	const func2 = Haskell.valueToCode(block, "B", Haskell.ORDER_APPLICATION)
		  || "id"
	const code = func1 + " $ " + func2
	return [code, Haskell.ORDER_APPLICATION]
}

Haskell["function_partialize"] = function(block) {
	// Most functional programmers would call this a section
	// as in a section of "1 + something" or "map a funcion onto something"
	// There is no Python equivalent of this, sadly
	return [" ", Haskell.ORDER_ATOMIC]
}

Haskell["function_let"] = function(block) {
	let n = 0
	let code = "let", branchCode, conditionCode
	const expression =
		  Haskell.valueToCode(block, "EXP", Haskell.ORDER_NONE) || "()"
	do {
		conditionCode =
			Haskell.valueToCode(block, "LET" + n, Haskell.ORDER_NONE) || "_"
		branchCode =
			Haskell.valueToCode(block, "AS" + n, Haskell.ORDER_NONE) || "()"

		code += "\n" + Haskell.prefixLines(
			conditionCode + " = " + branchCode,
			Haskell.INDENT
		)
		n++
	} while (block.getInput("LET" + n))

	if (n === 0) return [expression, Haskell.ORDER_NONE]
	return [code  + " in " + expression, Haskell.ORDER_NONE]
}

// Variable blocks

Haskell["variables_get_functional"] = function(block) {
	// Variable getter.
	let code = Haskell.nameDB_.getName(
		block.getFieldValue("VAR"),
		FNames.NameType.VARIABLE
	)
	const args = new Array(block.paramCount_)
	for (let i = 0; i < block.paramCount_; i++) {
		args[i] =
			Haskell.valueToCode(block, "ADD" + i, Haskell.ORDER_FUNCTION_PARAM)
			|| "()"
	}
	if (args.length) code += " " + args.join(" ")
	const order =
		  block.paramCount_ ? Haskell.ORDER_FUNCTION_CALL : Haskell.ORDER_ATOMIC
	return [code, order]
};

Haskell["variables_set_functional"] = function(block) {
	// Variable setter. (Fun fact: once you set it you can't change it)
	const argument0 = Haskell.valueToCode(block, "EXPR", Haskell.ORDER_NONE)
		  || "()"
	const varName = Haskell.nameDB_.getName(
		block.getFieldValue("VAR"),
		FNames.NameType.VARIABLE
	)
	const params = new Array(block.paramCount_)
	for (let i = 0; i < block.paramCount_; i++) {
		params[i] =
			Haskell.valueToCode(block, "ADD" + i, Haskell.ORDER_FUNCTION_PARAM)
			|| "()"
	}
	const parameterString = block.paramCount_ ? " " + params.join(" ") : ""
	return varName + parameterString + " = " + argument0 + "\n"
};


// Type blocks

Haskell["types_primitive"] = function(block) {
	// Primitives: Int, Char, Bool, Double.
	return [block.getFieldValue("TYPE"), Haskell.ORDER_ATOMIC]
}

Haskell["types_list"] = function(block) {
	// List of a type.
	const subtype = Haskell.valueToCode(block, "SUBTYPE", Haskell.ORDER_NONE)
	const code = "[" + subtype + "]"
	return [code, Haskell.ORDER_ATOMIC]
}

Haskell["types_tuple"] = function(block) {
	// Create a tuple type with any number of elements.
	// 1-element tuples, despite not being a feature in Haskell,
	// may be more intuitive.
	// The implementation is slightly different in the Python generator.
	const elements = new Array(block.itemCount_)
	for (let i = 0; i < block.itemCount_; i++) {
		elements[i] =
			Haskell.valueToCode(block, "ADD" + i, Haskell.ORDER_NONE) || "()"
	}
	const code = "(" + elements.join(", ") + ")"
	return [code, Haskell.ORDER_ATOMIC]
}

Haskell["types_placeholder"] = function(block) {
	const name = block.getFieldValue("NAME")
	return [name, Haskell.ORDER_ATOMIC]
}

Haskell["types_cast"] = function(block) {
	const value = Haskell.valueToCode(block, "VALUE", Haskell.ORDER_NONE) || "()"
	// Untested code
	const blockType = Haskell.valueToCode(block, "TYPE", Haskell.ORDER_NONE)
		  || "()"
	return [value + " :: " + blockType, Haskell.ORDER_ATOMIC]
}

Haskell["types_type"] = function(block) {
	const typeName = Haskell.nameDB_.getName(
		block.typeName_,
		FNames.NameType.TYPE
	)
	const elements = []
	let i = 0
	while (block.getInput("DATA" + i)) {
		elements.push(
			Haskell.valueToCode(
				block,
				"DATA" + i,
				Haskell.ORDER_FUNCTION_PARAM
			) || "()"
		)
		i++
	}

	let code = typeName
	let order = Haskell.ORDER_ATOMIC
	if (elements.length) {
		code += " " + elements.join(" ")
		order = Haskell.ORDER_FUNCTION_CALL
	}
	
	return [code, order]
}

Haskell["types_dc_def"] = function(block) {
	const blockType = Haskell.nameDB_.getName(
		block.getFieldValue("TYPE"),
		FNames.NameType.TYPE
	)
	if (!Haskell.typedefs[blockType]) Haskell.typedefs[blockType] = []

	const dataConsName = Haskell.nameDB_.getName(
		block.getFieldValue("NAME"),
		FNames.NameType.DATACONS
	)
	const elements = new Array(block.itemCount_)
	elements[0] = dataConsName
	for (let i = 0; i < block.itemCount_; i++) {
		elements[i + 1] =
			Haskell.valueToCode(block, "DATA" + i, Haskell.ORDER_NONE) || "()"
	}

	Haskell.typedefs[blockType].push(
		elements.join(" ")
	)
	return ""
}

Haskell["types_dc_get"] = function(block) {
	const dcName = Haskell.nameDB_.getName(
		block.dcName_,
		FNames.NameType.DATACONS
	)
	const elements = []
	let i = 0
	while (block.getInput("DATA" + i)) {
		elements.push(
			Haskell.valueToCode(
				block,
				"DATA" + i,
				Haskell.ORDER_FUNCTION_PARAM
			) || "()"
		)
		i++
	}
	
	let code = dcName
	let order = Haskell.ORDER_ATOMIC
	if (elements.length) {
		code += " " + elements.join(" ")
		order = Haskell.ORDER_FUNCTION_CALL
	}
	
	return [code, order]
}

// I/O operations

Haskell["monad_print"] = function(block) {
	// Print the representation of a value
	const value =
		  Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM) || "0"
	return ["print " + value, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["monad_putstr"] = function(block) {
	// Output the specified string
	const value =
		  Haskell.valueToCode(block, "STR", Haskell.ORDER_FUNCTION_PARAM) || "\"\""
	const action = "putStr" + (block.getFieldValue("NEWLINE") == "TRUE" ? "Ln": "")
	return [action + " " + value, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["monad_prompt"] = function(block) {
	return ["getLine", Haskell.ORDER_ATOMIC]
}

// Monads

Haskell["monad_return"] = function(block) {
	// Make a value mOnAdIc
	const value =
		  Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM) || "()"
	return ["return " + value, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["monad_fail"] = function(block) {
	// Make a monad fail
	const value =
		  Haskell.valueToCode(block, "ERR", Haskell.ORDER_FUNCTION_PARAM) || "\"\""
	return ["fail " + value, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["monad_operations"] = function(block) {
	// Basic monadic operators, and power.
	const OPERATORS = {
		"BIND": " >>= ",
		"THEN": " >> "
	}
	const operator = OPERATORS[block.getFieldValue("OP")]
	const order = Haskell.ORDER_MONAD_OPS
	const argument0 =
		  Haskell.valueToCode(block, "A", order) || "return ()"
	const argument1 =
		  Haskell.valueToCode(block, "B", order) || "print"
	const code = argument0 + operator + argument1
	return [code, order]
}

Haskell["monad_bindings"] = function(block) {
	// Basic monadic operators, and power.
	const OPERATORS = {
		"DOLET": ["", " <- "],
		"LET": ["let ", " = "]
	}
	const tuple = OPERATORS[block.getFieldValue("OP")]
	const prefix = tuple[0]
	const operator = tuple[1]
	const order = Haskell.ORDER_NONE
	const argument0 =
		  Haskell.valueToCode(block, "A", order) || "_"
	const argument1 =
		  Haskell.valueToCode(block, "B", order) || "getLine"
	const code = prefix + argument0 + operator + argument1 + "\n"
	return code
}
