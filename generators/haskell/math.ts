
// Math blocks

import { Block } from "blockly"
import { HaskellGenerator } from "./haskell_generator"

export function math_number(block: Block, generator: HaskellGenerator) {
	// Numeric value.
	let code: number | string = Number(block.getFieldValue("NUM"))
	let order
	if (code === Infinity) {
		code = "1 / 0"
		order = generator.ORDER_MULTIPLICATIVE
	} else if (code === -Infinity) {
		code = "(-1) / 0"
		order = generator.ORDER_MULTIPLICATIVE
	} else {
		// Sadly there is no easy way to determine
		// when unaries can go without parentheses
		order = code < 0 ? generator.ORDER_UNARY_SIGN : generator.ORDER_ATOMIC
	}
	return [code ? code.toString() : "0", order]
}

export function math_arithmetic(block: Block, generator: HaskellGenerator) {
	// Basic arithmetic operators, and power.
	const OPERATORS = {
		"ADD": [" + ", generator.ORDER_ADDITIVE],
		"MINUS": [" - ", generator.ORDER_ADDITIVE],
		"MULTIPLY": [" * ", generator.ORDER_MULTIPLICATIVE],
		"DIVIDE": [" / ", generator.ORDER_MULTIPLICATIVE],
		"POWER": [" ** ", generator.ORDER_EXPONENTIATION],
	}
	const tuple = OPERATORS[block.getFieldValue("OP")]
	const operator = tuple[0]
	const order = tuple[1]
	const argument0 = generator.valueToCode(block, "A", order) || "0"
	const argument1 = generator.valueToCode(block, "B", order) || "0"
	const code = argument0 + operator + argument1
	return [code, order]
	// We'll get back to this later. The exponentiation operator is unpleasant
	// to say the least. There are two versions of it here:
	//  1. (^): Works on integers
	//  2. (**): Works on floating-point numbers
	// TODO: Implement a custom operator for both purposes.
}

export function math_single(block: Block, generator: HaskellGenerator) {
	// Math operators with single operand.
	const operator = block.getFieldValue("OP");
	let code: string = "";
	let arg: string;
	if (operator === "SIN" || operator === "COS" || operator === "TAN") {
		arg = generator.valueToCode(block, "NUM", generator.ORDER_MULTIPLICATIVE)
			|| "0";
	} else {
		arg = generator.valueToCode(block, "NUM", generator.ORDER_FUNCTION_PARAM)
			|| "0";
	}
	// First, handle cases which generate values that don't need parentheses
	// wrapping the code.
	switch (operator) {
	case "ABS":
		code = "abs " + arg;
		break;
	case "NEG":
		code = "(0-) " + arg;
		break;
	case "ROOT":
		code = "sqrt " + arg;
		break;
	case "LN":
		code = "log " + arg;
		break
	case "LOG10":
		code = "(\\x -> log x / log 10) " + arg;
		break;
	case "EXP":
		code = "exp " + arg;
		break;
	case "POW10":
		code = "(10**) " + arg;
		break;
	case "ROUND":
		code = "round " + arg;
		break;
	case "ROUNDUP":
		code = "ceiling " + arg;
		break;
	case "ROUNDDOWN":
		code = "floor " + arg;
		break;
	case "SIN":
		code = "sin (" + arg + " / 180.0 * math.pi)";
		break;
	case "COS":
		code = "cos (" + arg + " / 180.0 * math.pi)";
		break;
	case "TAN":
		code = "tan (" + arg + " / 180.0 * math.pi)";
		break;
	}
	if (code) {
		return [code, generator.ORDER_FUNCTION_CALL]
	}
	// Second, handle cases which generate values that may need parentheses
	// wrapping the code.
	switch (operator) {
	case "ASIN":
		code = "asin " + arg + " / math.pi * 180";
		break;
	case "ACOS":
		code = "acos " + arg + " / math.pi * 180";
		break;
	case "ATAN":
		code = "atan " + arg + " / math.pi * 180";
		break;
	default:
		throw Error("Unknown math operator: " + operator);
	}
	return [code, generator.ORDER_MULTIPLICATIVE];;
}

export function math_constant(block: Block, generator: HaskellGenerator) {
	// Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
	const CONSTANTS: { [constant: string]: [string, number] } = {
		"PI": ["pi", generator.ORDER_MEMBER],
		"E": ["exp 1", generator.ORDER_FUNCTION_CALL],
		"GOLDEN_RATIO": ["(1 + sqrt 5) / 2", generator.ORDER_MULTIPLICATIVE],
		"SQRT2": ["sqrt 2", generator.ORDER_FUNCTION_CALL],
		"SQRT1_2": ["sqrt (1.0 / 2)", generator.ORDER_FUNCTION_CALL],
		"INFINITY": ["1 / 0", generator.ORDER_MULTIPLICATIVE],
	};
	const constant = block.getFieldValue("CONSTANT");
	return CONSTANTS[constant];
}

export function math_number_property(block: Block, generator: HaskellGenerator) {
	const PROPERTIES: { [property: string]: [string | null, number, number] } = {
		"EVEN": [" `mod` 2 == 0", generator.ORDER_MULTIPLICATIVE, generator.ORDER_RELATIONAL],
		"ODD": [" `mod` 2 /= 0", generator.ORDER_MULTIPLICATIVE, generator.ORDER_RELATIONAL],
		"WHOLE": [null, generator.ORDER_RELATIONAL, generator.ORDER_RELATIONAL],
		"POSTITIVE": [" > 0", generator.ORDER_RELATIONAL, generator.ORDER_RELATIONAL],
		"NEGATIVE": [" < 0", generator.ORDER_RELATIONAL, generator.ORDER_RELATIONAL],
		"DIVISIBLE_BY": [null, generator.ORDER_MULTIPLICATIVE,
						generator.ORDER_RELATIONAL],
		"PRIME": [null, generator.ORDER_FUNCTION_PARAM, generator.ORDER_FUNCTION_CALL]
	};
	const dropdownProperty = block.getFieldValue("PROPERTY");
	const [suffix, inputOrder, outputOrder] = PROPERTIES[dropdownProperty];
	const numberToCheck = generator.valueToCode(block, "NUMBER_TO_CHECK", inputOrder)
		|| "0";
	let code: string;
	switch (dropdownProperty) {
	case "PRIME":
		const functionName = generator.provideFunction_("math_isPrime", `
${generator.FUNCTION_NAME_PLACEHOLDER_} n = let
isTwoOrThree = n == 2 || n == 3
isInvalid = n <= 1 || n \`mod\` 1 /= 0 || n \`mod\` 2 == 0 || n \`mod\` 3 == 0
checkRange = all (\\x -> n \`mod\` (x - 1) /= 0 && n \`mod\` (x + 1) /= 0) [6, 12..(floor $ sqrt $ fromIntegral n) + 1] in if isTwoOrThree
	then True
	else if isInvalid
	then False
	else checkRange
`);
		code = functionName + " " + numberToCheck;
		break;
	case "DIVISIBLE_BY":
		const divisor = generator.valueToCode(block, "DIVISOR",
											generator.ORDER_MULTIPLICATIVE) || "1";
		code = numberToCheck + " % " + divisor + " == 0";
		break;
	case "WHOLE":
		code = numberToCheck + " == fromInteger (round " + numberToCheck + ")";
		break;
	default:
		code = numberToCheck + suffix;
	}
	return [code, outputOrder];
}

// Rounding functions have a single operand.
export const math_round = math_single
// Trigonometry functions have a single operand.
export const math_trig = math_single

export function math_modulo(block: Block, generator: HaskellGenerator) {
	// Remainder computation.
	const argument0 =
		generator.valueToCode(block, "DIVIDEND", generator.ORDER_FUNCTION_PARAM) || "0";
	const argument1 =
	generator.valueToCode(block, "DIVISOR", generator.ORDER_FUNCTION_PARAM) || "1";
	const code = "mod " + argument0 + " " + argument1;
	return [code, generator.ORDER_MULTIPLICATIVE];
}

export function math_constrain(block: Block, generator: HaskellGenerator) {
	// Constrain a number between two limits.
	const argument0 =
		generator.valueToCode(block, "VALUE", generator.ORDER_FUNCTION_PARAM) || "0";
	const argument1 =
		generator.valueToCode(block, "LOW", generator.ORDER_FUNCTION_PARAM) || "0";
	const argument2 =
		generator.valueToCode(block, "HIGH", generator.ORDER_FUNCTION_PARAM) || "(1 / 0)";
	const code =
		"min (max " + argument0 + " " + argument1 + ") " + argument2;
	return [code, generator.ORDER_FUNCTION_CALL];
}

export function math_atan2(block: Block, generator: HaskellGenerator) {
	// Arctangent of point (X, Y) in degrees from -180 to 180.
	const argument0 = generator.valueToCode(block, "X", generator.ORDER_NONE) || "1";
	const argument1 = generator.valueToCode(block, "Y", generator.ORDER_NONE) || "0";
	return [
		"atan2 " + argument1 + " " + argument0 + " / pi * 180",
		generator.ORDER_MULTIPLICATIVE
	];
}