import * as Blockly from "blockly";
import { FBlockDefinition } from "../miscellaneous/blockdefs";

const BLOCK_DEFINITIONS: FBlockDefinition[] = [
	{
		"type": "tuples_create_empty",
		"message0": "create empty tuple",
		"output": "Tuple",
		"colour": 65,
		"tooltip": "Returns an empty tuple.",
		"helpUrl": ""
	},
	{
		"type": "tuples_create_with_container",
		"message0": "tuple %1 %2",
		"args0": [
			{
				"type": "input_dummy"
			},
			{
				"type": "input_statement",
				"name": "STACK"
			}
		],
		"colour": 65,
		"tooltip": "Add, remove, or reorder sections to reconfigure this tuple block.",
		"helpUrl": "",
		"enableContextMenu": false
	},
	{
		"type": "tuples_create_with_item",
		"message0": "item",
		"previousStatement": null,
		"nextStatement": null,
		"colour": 65,
		"tooltip": "Add an item to the tuple.",
		"helpUrl": "",
		"enableContextMenu": false
	},
	{
		"type": "tuples_pair",
		"message0": "%1 of %2",
		"args0": [
			{
				"type": "field_dropdown",
				"name": "ACC",
				"options": [
					[
						"first",
						"FIRST"
					],
					[
						"second",
						"SECOND"
					]
				]
			},
			{
				"type": "input_value",
				"name": "NAME",
				"check": "Tuple"
			}
		],
		"output": null,
		"colour": 65,
		"extensions": [
			"tuple_op_tooltip"
		],
		"helpUrl": ""
	},
	{
		"type": "tuples_create_with",
		"colour": 65,
		"mutator": "tuples_create_with_mutator",
		"output": "Tuple",
		"extensions": [
			"tuples_post_initialization"
		],
		"tooltip": "Create a tuple with any number of items."
	}
];
const blocks = Blockly.common.createBlockDefinitionsFromJsonArray(BLOCK_DEFINITIONS);

type TupleMutatorBlock = Blockly.BlockSvg & ITupleMutator;
interface ITupleMutator extends TupleMutatorType {}
type TupleMutatorType = typeof TupleMutator;

type TupleMutatorItemBlock = Blockly.BlockSvg & {
	valueConnection_: Blockly.Connection | null;
};

const TupleMutator = {
	itemCount_: 2,

	saveExtraState: function(this: TupleMutatorBlock) {
		return {
			"itemCount": this.itemCount_
		};
	},

	loadExtraState: function(this: TupleMutatorBlock, state: any) {
		this.itemCount_ = state["itemCount"];
		this.updateShape_();
	},

	decompose: function(workspace: Blockly.WorkspaceSvg) {
		const containerBlock = workspace.newBlock("tuples_create_with_container");
		containerBlock.initSvg();
		let connection = containerBlock.getInput("STACK")?.connection;
		for (let i = 0; i < this.itemCount_; ++i) {
			const itemBlock = workspace.newBlock("tuples_create_with_item");
			itemBlock.initSvg();
			connection?.connect(itemBlock.previousConnection);
			connection = itemBlock.nextConnection;
		}
		return containerBlock;
	},

	compose: function(this: TupleMutatorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK");
		const connections: (Blockly.Connection | null)[] = [];
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			connections.push((itemBlock as TupleMutatorItemBlock).valueConnection_);
			itemBlock = itemBlock.getNextBlock();
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			const connection = this.getInput("ADD" + i)?.connection?.targetConnection;
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect();
			}
		}
		this.itemCount_ = connections.length;
		this.updateShape_();

		for (let i = 0; i < this.itemCount_; ++i) {
			connections[i]?.reconnect(this, "ADD" + i);
		}
	},

	saveConnections: function(this: TupleMutatorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK");
		let i = 0;
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			const input = this.getInput("ADD" + i);
			(itemBlock as TupleMutatorItemBlock).valueConnection_ =
				input && input?.connection?.targetConnection || null;
			itemBlock = itemBlock.getNextBlock();
			i++;
		}
	},

	updateShape_: function(this: TupleMutatorBlock) {
		if (this.itemCount_ && this.getInput("EMPTY")) {
			this.removeInput("EMPTY");
		}
		else if (!this.itemCount_ && !this.getInput("EMPTY")) {
			this.appendDummyInput("EMPTY").appendField("create empty tuple");
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			if (!this.getInput("ADD" + i)) {
				const input = this.appendValueInput("ADD" + i)
					  .setAlign(Blockly.inputs.Align.RIGHT);
				if (i === 0) {
					input.appendField("create tuple with");
				}
			}
		}

		for (let i = this.itemCount_; this.getInput("ADD" + i); ++i) {
			this.removeInput("ADD" + i);
		}
	}
};
Blockly.Extensions.registerMutator(
	"tuples_create_with_mutator",
	TupleMutator,
	undefined,
	["tuples_create_with_item"]
);

const TOOLTIPS_BY_AXEN = {
	"FIRST": "Return the first value of a 2-tuple.",
	"SECOND": "Return the second value of a 2-tuple."
};
Blockly.Extensions.register(
	"tuple_op_tooltip",
	Blockly.Extensions.buildTooltipForDropdown("ACC", TOOLTIPS_BY_AXEN)
);

// It's an informal name, but please forget about it
function updateShapeLikeATrueList(this: TupleMutatorBlock) {
	this.updateShape_();
}
Blockly.Extensions.register(
	"tuples_post_initialization",
	updateShapeLikeATrueList
);

Blockly.common.defineBlocks(blocks);
