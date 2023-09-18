// Functions

import { Block } from "blockly";
import { HaskellGenerator } from "./haskell_generator";

export function function_compose(block: Block, generator: HaskellGenerator) {
	const func1 = generator.valueToCode(block, "A", generator.ORDER_COMPOSITION)
		|| "id";
	const func2 = generator.valueToCode(block, "B", generator.ORDER_COMPOSITION)
		|| "id";
	const code = func1 + " . " + func2;
	return [code, generator.ORDER_COMPOSITION];
}

export function function_apply(block: Block, generator: HaskellGenerator) {
	const func1 = generator.valueToCode(block, "A", generator.ORDER_APPLICATION)
		|| "id";
	const func2 = generator.valueToCode(block, "B", generator.ORDER_APPLICATION)
		|| "id";
	const code = func1 + " $ " + func2;
	return [code, generator.ORDER_APPLICATION];
}

export function function_partialize(block: Block, generator: HaskellGenerator) {
	// Most functional programmers would call this a section
	// as in a section of "1 + something" or "map a funcion onto something"
	// There is no Python equivalent of this, sadly
	return [" ", generator.ORDER_ATOMIC];
}

export function function_let(block: Block, generator: HaskellGenerator) {
	let n = 0;
	let code: string = "let", branchCode: string, conditionCode: string;
	const expression =
		generator.valueToCode(block, "EXP", generator.ORDER_NONE) || "()";
	do {
		conditionCode =
			generator.valueToCode(block, "LET" + n, generator.ORDER_NONE) || "_";
		branchCode =
			generator.valueToCode(block, "AS" + n, generator.ORDER_NONE) || "()";

		code += "\n" + generator.prefixLines(
			conditionCode + " = " + branchCode,
			generator.INDENT
		);
		n++;
	} while (block.getInput("LET" + n));

	if (n === 0) return [expression, generator.ORDER_NONE];
	return [code  + " in " + expression, generator.ORDER_NONE];
}