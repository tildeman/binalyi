import * as Blockly from "blockly";
import { FNames } from "../../miscellaneous/names";
import { isTypeWorkspace } from "../../categories/types";

/**
 * The generator for Haskell uses significant portions of code from the
 * built-in Python and JavaScript generators. However, as a purely
 * functional programming language, the semantics of the blocks here
 * are designed significantly differently to reflect the paradigm.
 */
export class HaskellGenerator extends Blockly.CodeGenerator {
	// Order of operations enumerations
	readonly ORDER_ATOMIC = 0;
	readonly ORDER_FUNCTION_PARAM = 1;
	readonly ORDER_FUNCTION_CALL = 2;
	readonly ORDER_COMPOSITION = 3;
	readonly ORDER_MEMBER = 4;
	readonly ORDER_EXPONENTIATION = 5;
	readonly ORDER_MULTIPLICATIVE = 6;
	readonly ORDER_ADDITIVE = 7;
	readonly ORDER_UNARY_SIGN = 8;
	readonly ORDER_LIST_APPEND = 9;
	readonly ORDER_LIST_CONCAT = 10;
	readonly ORDER_RELATIONAL = 11;
	readonly ORDER_LOGICAL_AND = 13;
	readonly ORDER_LOGICAL_OR = 14;
	readonly ORDER_CONSTRUCTOR = 15;
	readonly ORDER_MONAD_OPS = 16;
	readonly ORDER_APPLICATION = 17;
	readonly ORDER_CONDITIONAL = 18;
	readonly ORDER_NONE = +84; // Superficial purposes.

	// addReservedWords()


	// Initialization

	isInitialized: boolean;
	definitions_: { [key: string]: string; };
	nameDB_: FNames;
	typedefs: { [key: string]: string[] };

	constructor(name: string = "Haskell") {
		super(name);
		this.nameDB_ = new FNames("");
		this.definitions_ = Object.create(null);
		this.typedefs = Object.create(null);
		this.isInitialized = false;
	}

	init(workspace: Blockly.WorkspaceSvg) {
		// Call Blockly.CodeGenerator's init.
		super.init(workspace);

		if (!this.nameDB_) {
			this.nameDB_ = new FNames(this.RESERVED_WORDS_);
		}
		else {
			this.nameDB_.reset();
		}

		this.nameDB_.setVariableMap(workspace.getVariableMap());
		this.nameDB_.populateVariables(workspace);
		if (isTypeWorkspace(workspace)) this.nameDB_.populateTypes(workspace);

		this.typedefs = Object.create(null);
		this.definitions_ = Object.create(null);

		this.isInitialized = true;
	}

	finish(code: string) {
		const type_definitions: string[] = [];
		const definitions = Object.values(this.definitions_);
		for (let typeName in this.typedefs) {
			const definitions = this.typedefs[typeName];
			type_definitions.push("data " + typeName + " = " + definitions.join(" | "));
		}
		this.isInitialized = false;

		this.nameDB_?.reset();
		const allDefs = definitions.join("\n") + type_definitions.join("\n") + "\n\n";
		return allDefs + code;
	}


	// Miscellaneous functions

	quote_(text: string) {
		return '"' + text + '"';
	}

	multiline_quote_(string: string) {
		const lines = string.split(/\n/g).map(this.quote_);
		// Join with the following, plus a newline:
		// ++ "\n" ++
		return lines.join(' ++ "\\n" ++ \n');
	}

	getAdjustedInt(block: Blockly.Block, input: string) {
		return this.valueToCode(block, input, this.ORDER_NONE);
	}
}