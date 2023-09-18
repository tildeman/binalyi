import * as Blockly from "blockly";
import { InputWithCreatedVariables } from "../miscellaneous/mutated_blocks";
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
		"style": "procedure_blocks",
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
		"style": "procedure_blocks",
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
		"style": "procedure_blocks",
		"tooltip": "Apply the left-hand-side to the right-hand-side.",
		"helpUrl": "https://wiki.haskell.org/$"
	},
	{
		"type": "function_let",
		"output": null,
		"style": "procedure_blocks",
		"tooltip": "Declare local variables for use in an expression.",
		"helpUrl": "",
		"mutator": "let_mutator",
		"extensions": [
			"function_let_post_initialization"
		]
	},
	{
		"type": "function_let_mutatorarg",
		"message0": "binding",
		"previousStatement": null,
		"nextStatement": null,
		"style": "procedure_blocks",
		"tooltip": "Add, remove, or reorder inputs to this let binding",
		"enableContextMenu": false,
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
		"style": "procedure_blocks",
		"tooltip": "",
		"helpUrl": ""
	},
	{
		"type": "function_partialize",
		"message0": "\ud83d\udc22",
		"output": null,
		"colour": 290,
		"tooltip": "Turn an operator into an ordinary function.",
		"helpUrl": ""
	}
];
const blocks = Blockly.common.createBlockDefinitionsFromJsonArray(BLOCK_DEFINITIONS)

type LetMutatorBlock = Blockly.BlockSvg & ILetMutator;
interface ILetMutator extends LetMutatorType {}
type LetMutatorType = typeof LetMutator;

type LetMutatorItemBlock = Blockly.BlockSvg & {
	valueConnection_: [Blockly.Connection | null, Blockly.Connection | null] | null;
};

const LetMutator = {
	itemCount_: 2,

	saveExtraState: function(this: LetMutatorBlock) {
		return {
			"itemCount": this.itemCount_
		};
	},

	loadExtraState: function(this: LetMutatorBlock, state: any) {
		this.itemCount_ = state["itemCount"];
		this.updateShape_();
	},

	decompose: function(this: LetMutatorBlock, workspace: Blockly.WorkspaceSvg) {
		const containerBlock = workspace.newBlock('function_let_container');
		containerBlock.initSvg();
		const stackInput = containerBlock.getInput('STACK');
		if (!stackInput) return containerBlock;
		let connection = stackInput.connection;
		for (let i = 0; i < this.itemCount_; ++i) {
			const itemBlock = workspace.newBlock('function_let_mutatorarg');
			itemBlock.initSvg();
			if (connection) connection.connect(itemBlock.previousConnection);
			connection = itemBlock.nextConnection;
		}
		return containerBlock;
	},

	compose: function(this: LetMutatorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock('STACK');
		const connections: (Blockly.Connection | null)[] = []; // This array deals with LET inputs
		const snoitcennoc: (Blockly.Connection | null)[] = []; // This array deals with AS  inputs
		for (let i = 0; itemBlock; ++i) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			let valcon = (itemBlock as LetMutatorItemBlock).valueConnection_ || [null, null];

			if (valcon) {
				connections.push(valcon[0]);
				snoitcennoc.push(valcon[1]);
			}

			itemBlock = itemBlock.getNextBlock();
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			const connection = this.getInput('LET' + i)?.connection?.targetConnection;
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect();
			}

			const noitcennoc = this.getInput("AS"  + i)?.connection?.targetConnection;
			if (noitcennoc && snoitcennoc.indexOf(noitcennoc) === -1) {
				noitcennoc.disconnect();
			}
		}
		this.itemCount_ = connections.length;
		this.updateShape_();

		for (let i = 0; i < this.itemCount_; ++i) {
			connections[i]?.reconnect(this, 'LET' + i);
			snoitcennoc[i]?.reconnect(this, "AS"  + i);
		}
	},

	saveConnections: function(this: LetMutatorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK");
		let i = 0;
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()){
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			const letinput = this.getInput("LET" + i) && this.getInput("LET" + i)?.connection?.targetConnection;
			const asinput  = this.getInput("AS"  + i) && this.getInput("AS"  + i)?.connection?.targetConnection;
			(itemBlock as LetMutatorItemBlock).valueConnection_ = [
				letinput || null,
				asinput || null
			];
			itemBlock = itemBlock.getNextBlock();
			i++;
		}
	},

	updateShape_: function(this: LetMutatorBlock) {
		let targetBlock: Blockly.Block | null = null;
		const expInput = this.getInput("EXP");
		if (expInput) {
			const targetBlockConnection = expInput.connection;
			if (targetBlockConnection) targetBlock = targetBlockConnection.targetBlock();
			this.removeInput("EXP");
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			let input = this.getInput("LET" + i);
			if (!input) {
				input = this.appendValueInput("LET" + i)
					.setAlign(Blockly.inputs.Align.RIGHT);
				if (i === 0) {
					// Unpopular opinion: use Python syntax for let bindings
					input.appendField("with");
				}
				else {
					input.appendField("and");
				}

				this.appendValueInput("AS" + i)
					.setAlign(Blockly.inputs.Align.RIGHT)
					.appendField("as");
			}
		}

		for (let i = this.itemCount_; this.getInput("LET" + i); ++i) {
			this.removeInput("LET" + i);
			this.removeInput("AS" + i);
		}

		const expr = this.appendValueInput("EXP")
			  .setAlign(Blockly.inputs.Align.RIGHT);
		if (targetBlock && expr.connection && targetBlock.outputConnection) {
			expr.connection.connect(targetBlock.outputConnection);
		}
		if (!this.itemCount_) {
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
		if (!outerWs) return null
		varName = varName.replace(/[\s\xa0]+/g, " ").replace(/^ | $/g, "");
		if (!varName) {
			return null;
		}

		const workspace = (sourceBlock.workspace as Blockly.WorkspaceSvg).targetWorkspace
			  || sourceBlock.workspace;
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
		let model = outerWs.getVariable(varName, "functional");
		if (model && model.name !== varName) {
			// Following Haskell's convention of lowercase names and titlecase classes
			outerWs.renameVariableById(model.getId(), varName);
		}
		if (!model) {
			model = outerWs.createVariable(varName, "functional");
			if (model && this.createdVariables_) {
				this.createdVariables_.push(model);
			}
		}

		return varName;
	},

	// If the answer is wrong, modify the answer key in your favor
	deleteImmediateVars_: function(this: InputWithCreatedVariables, newText: string) {
		if (!this.createdVariables_) this.createdVariables_ = [];
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

// It's an informal name, but please forget about it
function updateShapeLikeATrueList() {
	this.updateShape_();
}
Blockly.Extensions.register(
	"function_let_post_initialization",
	updateShapeLikeATrueList
);

Blockly.common.defineBlocks(blocks);
