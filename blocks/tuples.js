import * as Blockly from "blockly"

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
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
	}
])

blocks["tuples_create_with"] = {
	init: function() {
		this.setColour(65)
		this.itemCount_ = 3
		this.updateShape_()
		this.setOutput(true, "Tuple")
		this.setMutator(new Blockly.Mutator(["tuples_create_with_item"], this))
		this.setTooltip("Create a tuple with any number of items.")
	},

	saveExtraState: function() {
		return {
			"itemCount": this.itemCount_
		}
	},

	loadExtraState: function(state) {
		this.itemCount_ = state["itemCount"]
		this.updateShape_()
	},

	decompose: function(workspace) {
		const containerBlock = workspace.newBlock("tuples_create_with_container")
		containerBlock.initSvg()
		let connection = containerBlock.getInput("STACK").connection
		for (let i = 0; i < this.itemCount_; ++i) {
			const itemBlock = workspace.newBlock("tuples_create_with_item")
			itemBlock.initSvg()
			connection.connect(itemBlock.previousConnection)
			connection = itemBlock.nextConnection
		}
		return containerBlock
	},

	compose: function(containerBlock) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK")
		const connections = []
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock()
				continue
			}
			connections.push(itemBlock.valueConnection_)
			itemBlock = itemBlock.getNextBlock()
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			const connection = this.getInput("ADD" + i).connection.targetConnection
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect()
			}
		}
		this.itemCount_ = connections.length
		this.updateShape_()

		for (let i = 0; i < this.itemCount_; ++i) {
			Blockly.Mutator.reconnect(connections[i], this, "ADD" + i)
		}
	},

	saveConnections: function(containerBlock) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK")
		let i = 0
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock()
				continue
			}
			const input = this.getInput("ADD" + i)
			itemBlock.valueConnection_ = input && input.connection.targetConnection
			itemBlock = itemBlock.getNextBlock()
			i++
		}
	},

	updateShape_: function() {
		if (this.itemCount_ && this.getInput("EMPTY")) {
			this.removeInput("EMPTY")
		}
		else if (!this.itemCount_ && !this.getInput("EMPTY")) {
			this.appendDummyInput("EMPTY").appendField("create empty tuple")
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			if (!this.getInput("ADD" + i)) {
				const input = this.appendValueInput("ADD" + i)
					  .setAlign(Blockly.Input.Align.RIGHT)
				if (i === 0) {
					input.appendField("create tuple with")
				}
			}
		}

		for (let i = this.itemCount_; this.getInput("ADD" + i); ++i) {
			this.removeInput("ADD" + i)
		}
	}
}

const TOOLTIPS_BY_AXEN = {
	"FIRST": "Return the first value of a 2-tuple.",
	"SECOND": "Return the second value of a 2-tuple."
}
Blockly.Extensions.register(
	"tuple_op_tooltip",
	Blockly.Extensions.buildTooltipForDropdown("ACC", TOOLTIPS_BY_AXEN)
)

Blockly.common.defineBlocks(blocks)
