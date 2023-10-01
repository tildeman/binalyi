/**
 * @fileoverview Contains function definitions with a modified "let" input using a text field for variables.
 * This implementation is buggy and incomplete. Expect errors and glitches.
 */

import * as Blockly from "blockly";
import { FBlockDefinition } from "../miscellaneous/blockdefs";
import { InputWithCreatedVariables } from "../miscellaneous/mutated_blocks";
import { findLegalName } from "../categories/types";

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
		"output": null,
		"colour": 290,
		"tooltip": "Declare local variables for use in an expression.",
		"helpUrl": "",
		"mutator": "let_mutator",
		"extensions": [
			"function_let_post_initialization"
		]
	},
	{
		"type": "function_let_mutatorarg",
		"message0": "bind variable: %1",
		"args0": [
			{
				"type": "field_input",
				"name": "NAME",
				"text": ""
			}
		],
		"previousStatement": null,
		"nextStatement": null,
		"colour": 290,
		"tooltip": "Add, remove, or reorder inputs to this let binding",
		"enableContextMenu": false,
		"extensions": [
			"function_let_mutatorarg_validate_mixin",
			"function_let_mutatorarg_add_validator_helper"
		],
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
type LetMutatorType = typeof LetMutator & typeof validateLetBindingMixin;

type LetMutatorItemBlock = Blockly.BlockSvg & {
	valueConnection_: Blockly.Connection | null;
};

interface LetMutatorArgumentDefintion {
	type: "function_let_mutatorarg",
	id: string,
	fields: {
		NAME: any
	},
	next: {
		block?: LetMutatorArgumentDefintion
	}
}

interface LetMutatorContainerDefinition {
	type: "function_let_container",
	inputs: {
		STACK: {
			block?: LetMutatorArgumentDefintion
		}
	}
}

const LetMutator = {
	params_: [] as { id: string, name: any }[],

	saveExtraState: function(this: LetMutatorBlock) {
		return {
			"params": this.params_
		};
	},

	loadExtraState: function(this: LetMutatorBlock, state: any) {
		this.params_ = state["params"];
		this.updateShape_();
	},

	decompose: function(this: LetMutatorBlock, workspace: Blockly.WorkspaceSvg) {
		const containerBlockDef: LetMutatorContainerDefinition = {
			"type": "function_let_container",
			"inputs": {
				"STACK": {}
			}
		};

		let connDef = containerBlockDef["inputs"]["STACK"];
		for (const param of this.params_) {
			connDef.block = {
				type: "function_let_mutatorarg",
				id: param["id"],
				fields: {
					NAME: param["name"]
				},
				next: {}
			};
			connDef = connDef.block.next;
		}

		const containerBlock = Blockly.serialization.blocks.append(
			containerBlockDef,
			workspace,
			{recordUndo: false}
		);

		return containerBlock;
	},

	compose: function(this: LetMutatorBlock, containerBlock: Blockly.Block) {
		let newModel: { id: string, name: any }[] = [];
		let i = 0;
		let paramBlock = containerBlock.getInputTargetBlock("STACK");
		while (paramBlock && !paramBlock.isInsertionMarker()) {
			newModel.push({
				"id": paramBlock.id,
				"name": paramBlock.getFieldValue("NAME")
			});
			paramBlock = paramBlock.nextConnection
				&& paramBlock.nextConnection.targetBlock();
			++i;
		}
		this.params_ = newModel;
		this.updateShape_();
	},

	saveConnections: function(this: LetMutatorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK")
		let i = 0
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()){
				itemBlock = itemBlock.getNextBlock()
				continue
			}
			const input = this.getInput("LET" + i);
			(itemBlock as LetMutatorItemBlock).valueConnection_ =
				input && input?.connection?.targetConnection || null;
			itemBlock = itemBlock.getNextBlock();
			i++;
		}
	},

	updateShape_: function(this: LetMutatorBlock) {
		let targetBlock: Blockly.Block | null = null;
		if (this.getInput("EXP")) {
			targetBlock = this.getInput("EXP")?.connection?.targetBlock() || null;
			this.removeInput("EXP");
		}

		for (let i = 0; i < this.params_.length; ++i) {
			let input = this.getInput("LET" + i);
			if (!input) {
				input = this.appendValueInput("LET" + i)
					.setAlign(Blockly.inputs.Align.RIGHT);
				if (i === 0) {
					// Unpopular opinion: use Python syntax for let bindings
					input.appendField("with");
				}
				input.appendField(
						this.params_[i]["name"],
						"NAME" + i
					)
					.appendField("as");
			}

			this.setFieldValue(this.params_[i]["name"], "NAME" + i);
		}

		for (let i = this.params_.length; this.getInput("LET" + i); ++i) {
			this.removeInput("LET" + i);
		}

		const expr = this.appendValueInput("EXP")
			  .setAlign(Blockly.inputs.Align.RIGHT);
		if (targetBlock && targetBlock.outputConnection) {
			expr.connection?.connect(targetBlock.outputConnection);
		}
		if (!this.params_.length) {
			expr.appendField("with nothing");
		}
		expr.appendField("run");
	}
};
Blockly.Extensions.registerMutator(
	"let_mutator",
	LetMutator,
	undefined,
	["function_let_mutatorarg"]
);

const validateLetBindingMixin = {
	validator_: function(this: InputWithCreatedVariables, varName: string) {
		const sourceBlock = this.getSourceBlock();
		const outerWs = sourceBlock.workspace.getRootWorkspace();
		varName = varName.replace(/[\s\xa0]+/g, " ").replace(/^ | $/g, "");
		if (!varName) {
			return null;
		}

		const workspace = (sourceBlock.workspace as Blockly.WorkspaceSvg).targetWorkspace
			  || (sourceBlock.workspace as Blockly.WorkspaceSvg);
		const blocks = workspace.getAllBlocks(false);
		const caselessName = varName.toLowerCase(); // Thank god
		for (let i = 0; i < blocks.length; ++i) {
			if (blocks[i].id === this.getSourceBlock().id) {
				continue;
			}

			const otherVar = blocks[i].getFieldValue("NAME");
			if (otherVar && otherVar.toLowerCase() === caselessName) {
				return null;
			}
		}

		if (sourceBlock.isInFlyout) {
			return varName;
		}

		// Let bindings only deals with "Functional" vartype
		let model = outerWs?.getVariable(varName, "functional");
		if (model && model.name !== varName) {
			// Following Haskell's convention of lowercase names and titlecase classes
			outerWs?.renameVariableById(model.getId(), varName);
		}
		if (!model) {
			model = outerWs?.createVariable(varName, "functional");
			if (model && this.createdVariables_) {
				this.createdVariables_.push(model);
			}
		}

		return varName;
	},

	// If the answer is wrong, modify the answer key in your favor
	deleteImmediateVars_: function(this: InputWithCreatedVariables, newText: string) {
		const outerWs = this.getSourceBlock().workspace.getRootWorkspace();
		if (!outerWs) {
			return;
		}
		for (let i = 0; i < this.createdVariables_.length; ++i) {
			const model = this.createdVariables_[i];
			if (model.name !== newText) {
				outerWs.deleteVariableById(model.getId());
			}
		}
	}
};
Blockly.Extensions.registerMixin(
	"function_let_mutatorarg_validate_mixin",
	validateLetBindingMixin
);

function addValidatorToLetBindingHelper (this: LetMutatorBlock) {
	const nameField = this.getField("NAME");
	if (!nameField) return;

	// FIXME: Find a legal name for variables in a let binding.
	nameField.setValue(findLegalName("", this).toLowerCase());
	nameField.setValidator(this.validator_);
}
Blockly.Extensions.register(
	"function_let_mutatorarg_add_validator_helper",
	addValidatorToLetBindingHelper
);

// It's an informal name, but please forget about it
function updateShapeLikeATrueList(this: LetMutatorBlock) {
	this.updateShape_();
}
Blockly.Extensions.register(
	"function_let_post_initialization",
	updateShapeLikeATrueList
);

Blockly.common.defineBlocks(blocks);
