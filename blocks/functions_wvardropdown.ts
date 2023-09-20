/**
 * @fileoverview Contains function definitions with a modified "let" input using a dropdown for variables.
 * This implementation is buggy and incomplete. Expect errors and glitches.
 * (Old note: This is an absolute flop (please don't use this))
 */

import * as Blockly from "blockly"
import { FBlockDefinition } from "../miscellaneous/blockdefs";

const BLOCK_DEFINITIONS: FBlockDefinition[] = [
	{
		"type": "function_lambda",
		"message0": "\u03bb %1 \u2192 %2",
		"args0": [
			{
				"type": "field_variable",
				"name": "VAR",
				"variable": "%{BKY_VARIABLES_DEFAULT_NAME}",
				"variableTypes": ["functional"],
				"defaultType": "functional"
			},
			{
				"type": "input_value",
				"name": "EXPR"
			}
		],
		"output": null,
		"colour": 290,
		"tooltip": "Anonymous function with one argument. Very useful for brain incineration.",
		"helpUrl": ""
	},
	{
		"type": "function_compose",
		"message0": "%1 \u2218 %2",
		"args0": [
			{
				"type": "input_value",
				"name": "A"
			},
			{
				"type": "input_value",
				"name": "B"
			}
		],
		"inputsInline": true,
		"output": null,
		"colour": 290,
		"tooltip": "Return the composition of two functions.",
		"helpUrl": ""
	},
	{
		"type": "function_apply",
		"message0": "%1 $ %2",
		"args0": [
			{
				"type": "input_value",
				"name": "A"
			},
			{
				"type": "input_value",
				"name": "B"
			}
		],
		"inputsInline": true,
		"output": null,
		"colour": 290,
		"tooltip": "Apply the left-hand-side to the right-hand-side.",
		"helpUrl": "https://wiki.haskell.org/$"
	},
	{ // There's a reason this is not working
		"type": "function_let",
		"message0": "let %1 = %2 in %3",
		"args0": [
			{
				"type": "field_variable",
				"name": "NAME0",
				"variable": "%{BKY_VARIABLES_DEFAULT_NAME}",
				"variableTypes": ["functional"],
				"defaultType": "functional"
			},
			{
				"type": "input_value",
				"name": "LET0",
				"align": "RIGHT"
			},
			{
				"type": "input_value",
				"name": "EXP",
				"align": "RIGHT"
			}
		],
		"output": null,
		"colour": 290,
		"tooltip": "Declare local variables for use in an expression.",
		"helpUrl": "",
		"mutator": "let_mutator"
	},
	{
		"type": "function_let_mutatorarg",
		"message0": "binding",
		"previousStatement": null,
		"nextStatement": null,
		"colour": 290,
		"tooltip": "Add, remove, or reorder inputs to this let binding",
		"helpUrl": ""
	},
	{
		"type": "function_let_container",
		"message0": "bindings %1 %2",
		"args0": [
			{
				"type": "input_dummy"
			},
			{
				"type": "input_statement",
				"name": "STACK"
			}
		],
		"colour": 290,
		"tooltip": "",
		"helpUrl": ""
	}
];
const blocks = Blockly.common.createBlockDefinitionsFromJsonArray(BLOCK_DEFINITIONS);

type LetMutatorBlock = Blockly.BlockSvg & ILetMutator;
interface ILetMutator extends LetMutatorType {}
type LetMutatorType = typeof LetMutator;

type LetMutatorItemBlock = Blockly.BlockSvg & {
	valueConnection_: Blockly.Connection | null;
};

const LetMutator = {
	paramIds_: [] as (string | null)[],

	saveExtraState: function(this: LetMutatorBlock) {
		return {
			"params": this.paramIds_
		};
	},

	loadExtraState: function(this: LetMutatorBlock, state: any) {
		this.paramIds_ = state["params"];
		this.updateShape_();
	},

	decompose: function(this: LetMutatorBlock, workspace: Blockly.WorkspaceSvg) {
		const containerBlock = workspace.newBlock("function_let_container");
		containerBlock.initSvg();
		let connection = containerBlock.getInput("STACK")?.connection || null;
		for (let i = 0; i < this.paramIds_.length; ++i) {
			const itemBlock = workspace.newBlock("function_let_mutatorarg");
			itemBlock.initSvg();
			connection?.connect(itemBlock.previousConnection);
			connection = itemBlock.nextConnection;
		}
		return containerBlock;
	},

	compose: function(this: LetMutatorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK");

		let connections: (Blockly.Connection | null)[] = [];
		let toPush: (string | null)[] = [];
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			connections.push((itemBlock as LetMutatorItemBlock).valueConnection_);
			toPush.push(null);
			itemBlock = itemBlock.getNextBlock();
		}

		for (let i = 0; i < this.paramIds_.length; ++i) {
			const connection = this.getInput("LET" + (i + 1))?.connection?.targetConnection;
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect();
			}
			toPush[i] = this.getFieldValue("NAME" + (i + 1));
		}
		this.paramIds_ = toPush;
		this.updateShape_();

		for (let i = 0; i < this.paramIds_.length; ++i) {
			connections[i]?.reconnect(this, "LET" + (i + 1));
		}
	},

	saveConnections: function(this: LetMutatorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK");
		let i = 1;
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()){
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			const input = this.getInput("LET" + i);
			(itemBlock as LetMutatorItemBlock).valueConnection_ =
				input && input.connection?.targetConnection || null;
			itemBlock = itemBlock.getNextBlock();
			i++;
		}
	},

	updateShape_: function(this: LetMutatorBlock) {
		for (let i = 0; i < this.paramIds_.length; ++i) {
			let input = this.getInput("LET" + (i + 1));
			const vwid = this.workspace.getVariableById(this.paramIds_[i] || "");
			if (!input) {
				input = this.appendValueInput("LET" + (i + 1))
							.appendField(
								new Blockly.FieldVariable(
									null,
									undefined,
									["functional"],
									"functional"
								),
								"NAME" + (i + 1)
							)
							.appendField("=");
			}
		}

		for (let i = this.paramIds_.length; this.getInput("LET" + (i + 1)); ++i) {
			this.removeInput("LET" + (i + 1));
		}
	}
}
Blockly.Extensions.registerMutator(
	"let_mutator",
	LetMutator,
	undefined,
	["function_let_mutatorarg"]
);

Blockly.common.defineBlocks(blocks);
