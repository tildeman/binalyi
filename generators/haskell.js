import * as Blockly from "blockly"

export const Haskell = new Blockly.Generator("Haskell")
// TODO: Split this monster into several files

// Order of operations enumerations
Haskell.ORDER_ATOMIC = 0
Haskell.ORDER_FUNCTION_PARAM = 1
Haskell.ORDER_FUNCTION_CALL = 2
Haskell.ORDER_COMPOSITION = 3
Haskell.ORDER_EXPONENTIATION = 4
Haskell.ORDER_MULTIPLICATIVE = 5
Haskell.ORDER_ADDITIVE = 6
Haskell.ORDER_UNARY_SIGN = 7
Haskell.ORDER_LIST_APPEND = 9
Haskell.ORDER_LIST_CONCAT = 10
Haskell.ORDER_RELATIONAL = 11
Haskell.ORDER_LOGICAL_AND = 13
Haskell.ORDER_LOGICAL_OR = 14
Haskell.ORDER_APPLICATION = 16
Haskell.ORDER_NONE = +84 // Superficial purposes.

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
		  Haskell.valueToCode(block, "BOOL", Haskell.ORDER_FUNCTION_PARAM) || "True"
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

Haskell["text_reverse"] = function(block) {
	const text = Haskell.valueToCode(block, "TEXT", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "reverse " + text
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["text_parse"] = function(block) {
	const text = Haskell.valueToCode(block, "TEXT", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "read " + text
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["text_show"] = function(block) {
	const value = Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM) || "[]"
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
	const value = Haskell.valueToCode(block, "VALUE", Haskell.ORDER_LIST_APPEND) || "()"
	const list = Haskell.valueToCode(block, "LIST", Haskell.ORDER_LIST_CONCAT) || "[]"
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
	const list = Haskell.valueToCode(block, "LIST", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "reverse " + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_join"] = function(block) {
	const list1 = Haskell.valueToCode(block, "A", Haskell.ORDER_LIST_CONCAT) || "[]"
	const list2 = Haskell.valueToCode(block, "B", Haskell.ORDER_LIST_CONCAT) || "[]"
	const code = list1 + " ++ " + list2
	return [code, Haskell.ORDER_LIST_CONCAT]
}

Haskell["list_opad"] = function(block) {
	const list = Haskell.valueToCode(block, "NAME", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const action = block.getFieldValue("ACC")
	const func = action === "FIRST" ? "head " : "tail "
	const code = func + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_length"] = function(block) {
	// String or array length.
	const list = Haskell.valueToCode(block, "VALUE", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	return ["length " + list, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_isEmpty"] = function(block) {
	// Is the string null or array empty?
	const list = Haskell.valueToCode(block, "VALUE", Haskell.ORDER_NONE) || "[]"
	const code = list + " == []"
	return [code, Haskell.ORDER_RELATIONAL]
}

Haskell["lists_map"] = function(block) {
	const func = Haskell.valueToCode(block, "FUNC", Haskell.ORDER_FUNCTION_PARAM) || "id"
	const list = Haskell.valueToCode(block, "LIST", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "map " + func + " " + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_filter"] = function(block) {
	const func =
		  Haskell.valueToCode(block, "COND", Haskell.ORDER_FUNCTION_PARAM) || "(\_ -> true)"
	const list = Haskell.valueToCode(block, "LIST", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const code = "filter " + func + " " + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

Haskell["lists_fold"] = function(block) {
	const func = Haskell.valueToCode(block, "FUNC", Haskell.ORDER_FUNCTION_PARAM) || "(+)"
	const init = Haskell.valueToCode(block, "INIT", Haskell.ORDER_FUNCTION_PARAM) || "0"
	const list = Haskell.valueToCode(block, "LIST", Haskell.ORDER_FUNCTION_PARAM) || "[]"
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
	Haskell.definitions_["import_math"] = "import math"
	if (operator === "SIN" || operator === "COS" || operator === "TAN") {
		arg = Haskell.valueToCode(block, "NUM", Haskell.ORDER_MULTIPLICATIVE) || "0"
	} else {
		arg = Haskell.valueToCode(block, "NUM", Haskell.ORDER_FUNCTION_PARAM) || "0"
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
  const argument1 = Haskell.valueToCode(block, "LOW", Haskell.ORDER_FUNCTION_PARAM) || "0"
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
	// 1-element tuples, despite not being a feature in Haskell, may be more intuitive.
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
	const list = Haskell.valueToCode(block, "NAME", Haskell.ORDER_FUNCTION_PARAM) || "[]"
	const action = block.getFieldValue("ACC")
	const func = action === "FIRST" ? "fst " : "snd "
	const code = func + list
	return [code, Haskell.ORDER_FUNCTION_CALL]
}

// Blocks for functions

Haskell["function_compose"] = function(block) {
	const func1 = Haskell.valueToCode(block, "A", Haskell.ORDER_COMPOSITION) || "id"
	const func2 = Haskell.valueToCode(block, "B", Haskell.ORDER_COMPOSITION) || "id"
	const code = func1 + " . " + func2
	return [code, Haskell.ORDER_COMPOSITION]
}

Haskell["function_apply"] = function(block) {
	const func1 = Haskell.valueToCode(block, "A", Haskell.ORDER_APPLICATION) || "id"
	const func2 = Haskell.valueToCode(block, "B", Haskell.ORDER_APPLICATION) || "id"
	const code = func1 + " $ " + func2
	return [code, Haskell.ORDER_APPLICATION]
}

Haskell["function_partialize"] = function(block) {
	// Most functional programmers would call this a section
	// as in a section of "1 + something" or "map a funcion onto something"
	// There is no Python equivalent of this, sadly
	return [" ", Haskell.ORDER_ATOMIC]
}
