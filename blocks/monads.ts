/**
 * @fileoverview Contains monad block definitions with an extensible do-block with separate let bindings.
 */

import * as Blockly from "blockly";
import { FBlockDefinition } from "../miscellaneous/blockdefs";

const BLOCK_DEFINITIONS: FBlockDefinition[] = [
	{
		"type": "monad_return",
		"message0": "return %1",
		"args0": [
			{
				"type": "input_value",
				"name": "VALUE"
			}
		],
		"output": "Monad",
		"colour": 0,
		"tooltip": "Collects values into a wrapper.",
		"helpUrl": ""
	},
	{
		"type": "monad_operations",
		"message0": "%1 %2 %3",
		"args0": [
			{
				"type": "input_value",
				"name": "A",
				"check": "Monad"
			},
			{
				"type": "field_dropdown",
				"name": "OP",
				"options": [
					[
						"\ud83e\uddf2",
						"BIND"
					],
					[
						"\u21b7",
						"THEN"
					]
				]
			},
			{
				"type": "input_value",
				"name": "B"
			}
		],
		"inputsInline": true,
		"output": "Monad",
		"colour": 0,
		"tooltip": "Perform operations with monads.",
		"helpUrl": "",
		"extensions": ["monad_op_tooltip"]
	},
	{
		"type": "monad_bindings",
		"message0": "%1 %2 %3",
		"args0": [
			{
				"type": "input_value",
				"name": "A"
			},
			{
				"type": "field_dropdown",
				"name": "OP",
				"options": [
					[
						"\u2190",
						"DOLET"
					],
					[
						"=",
						"LET"
					]
				]
			},
			{
				"type": "input_value",
				"name": "B"
			}
		],
		"inputsInline": true,
		"output": "Monad", // Bindings don't actually produce monads
		"colour": 0,
		"tooltip": "Perform do-block bindings.",
		"helpUrl": "",
		"extensions": ["monad_op_tooltip"]
	},
	{
		"type": "monad_compose",
		"message0": "%1 %2 %3",
		"args0": [
			{
				"type": "input_value",
				"name": "A"
			},
			{
				"type": "field_dropdown",
				"name": "OP",
				"options": [
					[
						"\u21e8",
						"LEFT_COMPOSE"
					],
					[
						"\u21e6",
						"RIGHT_COMPOSE"
					]
				]
			},
			{
				"type": "input_value",
				"name": "B"
			}
		],
		"inputsInline": true,
		"output": "Monad",
		"colour": 0,
		"tooltip": "Compose monads.",
		"helpUrl": ""
	},
	{
		"type": "monad_fail",
		"message0": "fail %1",
		"args0": [
			{
				"type": "input_value",
				"name": "ERR",
				"check": "String"
			}
		],
		"output": "Monad",
		"colour": 0,
		"tooltip": "Terminate monadic actions with an error string.",
		"helpUrl": ""
	},
	{
		"type": "monad_action",
		"output": "Monad",
		"colour": 0,
		"tooltip": "Create a do-block with any number of actions.",
		"helpUrl": "",
		"mutator": "do_mutator",
		"extensions": [
			"do_block_post_initialization"
		]
	},
	{
		"type": "monad_action_container",
		"message0": "do %1 %2",
		"args0": [
			{
				"type": "input_dummy"
			},
			{
				"type": "input_statement",
				"name": "STACK"
			}
		],
		"colour": 0,
		"tooltip": "Add, remove or reorder sections to reconfigure this do-block.",
		"helpUrl": ""
	},
	{
		"type": "monad_action_item",
		"message0": "action",
		"previousStatement": null,
		"nextStatement": null,
		"colour": 0,
		"tooltip": "Add an action to the block.",
		"helpUrl": ""
	}
];
const blocks = Blockly.common.createBlockDefinitionsFromJsonArray(BLOCK_DEFINITIONS);

type MonadActionMutatorBlock = Blockly.BlockSvg & IMonadActionMutator;
interface IMonadActionMutator extends MonadActionMutatorType {}
type MonadActionMutatorType = typeof MonadActionMutator;

type MonadActionMutatorItemBlock = Blockly.BlockSvg & {
	valueConnection_: Blockly.Connection | null;
};

// When Google's JavaScript makes your life much harder

const MonadActionMutator = {
	itemCount_: 3,

	saveExtraState: function(this: MonadActionMutatorBlock) {
		return {
			"itemCount": this.itemCount_
		};
	},

	loadExtraState: function(this: MonadActionMutatorBlock, state: any) {
		this.itemCount_ = state["itemCount"];
		this.updateShape_()
	},

	decompose: function(this: MonadActionMutatorBlock, workspace: Blockly.WorkspaceSvg) {
		const topBlock = workspace.newBlock("monad_action_container");
		topBlock.initSvg();

		let stackInput = topBlock.getInput("STACK");
		if (!stackInput) return topBlock;
		let connection = stackInput.connection;
		for (let i = 0; i < this.itemCount_; ++i) {
			let itemBlock = workspace.newBlock("monad_action_item");
			itemBlock.initSvg();
			if (connection) connection.connect(itemBlock.previousConnection);
			connection = itemBlock.nextConnection;
		}

		return topBlock;
	},

	compose: function(this: MonadActionMutatorBlock, topBlock: Blockly.Block) {
		let itemBlock = topBlock.getInputTargetBlock("STACK") as MonadActionMutatorItemBlock | null;

		const connections: Blockly.Connection[] = [];
		while (itemBlock && !itemBlock.isInsertionMarker()) {
			if (itemBlock.valueConnection_) connections.push(itemBlock.valueConnection_);
			itemBlock = itemBlock.nextConnection &&
				itemBlock.nextConnection.targetBlock() as MonadActionMutatorItemBlock | null;
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			const addInput = this.getInput("ADD" + i);
			const hostConnection = addInput ? addInput.connection : null;
			const connection = hostConnection ? hostConnection.targetConnection : null;
			if (connection && connections.indexOf(connection) == -1) {
				connection.disconnect();
			}
		}

		this.itemCount_ = connections.length;
		this.updateShape_();

		for (let i = 0; i < this.itemCount_; ++i) {
			connections[i].reconnect(this, "ADD" + i);
		}
	},

	saveConnections: function(this: MonadActionMutatorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK") as MonadActionMutatorItemBlock | null;
		let i = 0;
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock() as MonadActionMutatorItemBlock;
				continue;
			}
			const connection = this.getInput("ADD" + i)?.connection?.targetConnection || null;
			itemBlock.valueConnection_ = connection;
			itemBlock = itemBlock.getNextBlock() as MonadActionMutatorItemBlock;
			i++;
		}
	},

	updateShape_: function(this: MonadActionMutatorBlock) {
		if (this.itemCount_ && this.getInput("EMPTY")) {
			this.removeInput("EMPTY");
		}
		else if (!this.itemCount_ && !this.getInput("EMPTY")) {
			this.appendDummyInput("EMPTY").appendField("do nothing");
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			if (!this.getInput("ADD" + i)) {
				const input = this.appendValueInput("ADD" + i)
					.setAlign(Blockly.inputs.Align.RIGHT)
					.setCheck("Monad");
				if (i === 0) {
					input.appendField("do");
				}
			}
		}

		for (let i = this.itemCount_; this.getInput("ADD" + i); ++i) {
			this.removeInput("ADD" + i);
		}
	}
};
Blockly.Extensions.registerMutator(
	"do_mutator",
	MonadActionMutator,
	undefined,
	["monad_action_item"]
);

const TOOLTIPS_BY_OP = {
	"BIND": "Binds a monadic value to a function and returns a monad of equivalent type constructor. (you know, typical functor jargon)",
	"THEN": "Takes two monadic values, and returns the second. Used for chaining monads.",
	"DOLET": "Unwraps the value from a monad, then binds it to a variable in a do-block.",
	"LET": "A depressed form of the let binding, to be used in a do-block."
};
Blockly.Extensions.register(
	"monad_op_tooltip",
	Blockly.Extensions.buildTooltipForDropdown("OP", TOOLTIPS_BY_OP)
);

function dbPostInit(this: MonadActionMutatorBlock) {
	this.updateShape_();
}
Blockly.Extensions.register(
	"do_block_post_initialization",
	dbPostInit
);

Blockly.common.defineBlocks(blocks)
