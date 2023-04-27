import * as Blockly from "blockly"

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
	{
		"type": "types_list",
		"message0": "List of %1",
		"args0": [
			{
				"type": "input_value",
				"name": "SUBTYPE",
				"check": "Type"
			}
		],
		"output": "Type",
		"style": "loop_blocks",
		"tooltip": "The list of whatever type.",
		"helpUrl": ""
	},
	{
		"type": "types_tuple",
		"output": "Type",
		"style": "loop_blocks",
		"tooltip": "A product type of different things.",
		"mutator": "types_mutator",
		"extensions": [
			"types_post_initialization"
		],
		"helpUrl": ""
	},
	{
		"type": "types_maybe",
		"message0": "Maybe %1",
		"args0": [
			{
				"type": "input_value",
				"name": "TYPE",
				"check": "Type"
			}
		],
		"output": "Type",
		"style": "loop_blocks",
		"tooltip": "The anonymous error type.",
		"helpUrl": ""
	},
	{
		"type": "types_primitive",
		"message0": "%1",
		"args0": [
			{
				"type": "field_dropdown",
				"name": "TYPE",
				"options": [
					[
						"Big integer",
						"Integer"
					],
					[
						"Integer",
						"Int"
					],
					[
						"Decimal",
						"Float"
					],
					[
						"Big decimal",
						"Double"
					],
					[
						"Character",
						"Char"
					]
				]
			}
		],
		"output": "Type",
		"style": "loop_blocks",
		"tooltip": "A primitive data type.",
		"helpUrl": ""
	},
	{
		"type": "types_mutator_container",
		"message0": "types %1 %2",
		"args0": [
			{
				"type": "input_dummy"
			},
			{
				"type": "input_statement",
				"name": "STACK"
			}
		],
		"style": "loop_blocks",
		"tooltip": "Add, remove, or reorder sections to reconfigure this type block.",
		"helpUrl": ""
	},
	{
		"type": "types_mutator_item",
		"message0": "type",
		"previousStatement": null,
		"nextStatement": null,
		"style": "loop_blocks",
		"tooltip": "Add a type to the product",
		"helpUrl": ""
	},
	{
		"type": "types_placeholder",
		"message0": "%1",
		"args0": [
			{
				"type": "field_input",
				"name": "NAME",
				"text": "a"
			}
		],
		"output": "Type",
		"style": "loop_blocks",
		"tooltip": "A type placeholder to be used in templates.",
		"helpUrl": ""
	},
	{
		"type": "types_dc_def", // TODO: Make a block that uses data from this block.
		"message0": "data %1 of %2",
		"args0": [
			{
				"type": "field_input",
				"name": "NAME",
				"text": "Something"
			},
			{
				"type": "input_value",
				"name": "DATA0",
				"check": "Type"
			}
		],
		"extensions": [
			"data_constructor_initialization",
			"item_count_getter_mixin"
		],
		"mutator": "data_cons_mutator",
		"style": "loop_blocks",
		"tooltip": "",
		"helpUrl": ""
	},
	{
		"type": "types_type",
		"output": "Type",
		"style": "loop_blocks",
		"mutator": "type_mutator",
		"tooltip": "",
		"helpUrl": ""
	},
	{
		"type": "types_dc_get",
		"output": "Type",
		"style": "loop_blocks",
		"mutator": "data_cons_get_mutator",
		"tooltip": "",
		"helpUrl": ""
	},
])

const productTypeMutator = {
	itemCount_: 2,

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
		const containerBlock = workspace.newBlock("types_mutator_container")
		containerBlock.initSvg()
		let connection = containerBlock.getInput("STACK").connection
		for (let i = 0; i < this.itemCount_; ++i) {
			const itemBlock = workspace.newBlock("types_mutator_item")
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
			this.setTooltip("A product type of different things.")
		}
		else if (!this.itemCount_ && !this.getInput("EMPTY")) {
			this.appendDummyInput("EMPTY").appendField("Unit")
			this.setTooltip("The unit type (aka null, nil, none, etc.).")
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			if (!this.getInput("ADD" + i)) {
				const input = this.appendValueInput("ADD" + i)
								  .setAlign(Blockly.Input.Align.RIGHT)
								  .setCheck("Type")
				if (i === 0) {
					input.appendField("Tuple of")
				}
			}
		}

		for (let i = this.itemCount_; this.getInput("ADD" + i); ++i) {
			this.removeInput("ADD" + i)
		}
	}
}
Blockly.Extensions.registerMutator(
	"types_mutator",
	productTypeMutator,
	undefined,
	["types_mutator_item"]
)

function updateShapeLikeATrueList() {
	this.updateShape_()
}
Blockly.Extensions.register(
	"types_post_initialization",
	updateShapeLikeATrueList
)

function dataConstructorUpdateShape() {
	const input = this.getInput("DATA0")
	input
		.appendField(new Blockly.FieldDropdown(retrieveTypeList(this.workspace)), "TYPE")
		.appendField("with")
	this.updateShape_()
}
Blockly.Extensions.register(
	"data_constructor_initialization",
	dataConstructorUpdateShape
)

function retrieveTypeList(workspace) {
	return function() {
		if (workspace.getTypeMap) {
			return Object.keys(workspace.getTypeMap()).map((v) => {return [v, v]})
		}
		return [["Undefined", "Undefined"]]
	}
}

const itemCountGetterMixin = {
	getItemCount: function() {
		return this.itemCount_
	}
}
Blockly.Extensions.registerMixin(
	"item_count_getter_mixin",
	itemCountGetterMixin
)

const dataConstructorMutator = {
	itemCount_: 2,

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
		const containerBlock = workspace.newBlock("types_mutator_container")
		containerBlock.initSvg()
		let connection = containerBlock.getInput("STACK").connection
		for (let i = 0; i < this.itemCount_; ++i) {
			const itemBlock = workspace.newBlock("types_mutator_item")
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
			const connection = this.getInput("DATA" + i).connection.targetConnection
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect()
			}
		}
		this.itemCount_ = connections.length
		this.updateShape_()

		for (let i = 0; i < this.itemCount_; ++i) {
			Blockly.Mutator.reconnect(connections[i], this, "DATA" + i)
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
			const input = this.getInput("DATA" + i)
			itemBlock.valueConnection_ = input && input.connection.targetConnection
			itemBlock = itemBlock.getNextBlock()
			i++
		}
	},

	updateShape_: function() {
		const oldName =this.getFieldValue("NAME") || ""
		if (this.itemCount_ && this.getInput("EMPTY")) {
			this.removeInput("EMPTY")
		}
		else if (!this.itemCount_ && !this.getInput("EMPTY")) {
			this
				.appendDummyInput("EMPTY")
				.appendField("data")
				.appendField(new Blockly.FieldTextInput(
					this.getFieldValue("NAME")
				), "NAME")
				.appendField("of")
				.appendField(new Blockly.FieldDropdown(
					retrieveTypeList(this.workspace)
				), "TYPE")
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			if (!this.getInput("DATA" + i)) {
				const input = this.appendValueInput("DATA" + i)
					  .setAlign(Blockly.Input.Align.RIGHT)
					  .setCheck("Type")
				if (i === 0) {
					input.appendField("data")
						.appendField(new Blockly.FieldTextInput(oldName), "NAME")
						.appendField("of")
						.appendField(new Blockly.FieldDropdown(
							retrieveTypeList(this.workspace)
						), "TYPE")
						.appendField("with")
				}
			}
		}

		for (let i = this.itemCount_; this.getInput("DATA" + i); ++i) {
			this.removeInput("DATA" + i)
		}
	}
}
Blockly.Extensions.registerMutator(
	"data_cons_mutator",
	dataConstructorMutator,
	undefined,
	["types_mutator_item"]
)

const typeDefMutator = {
	typeName_: null,

	saveExtraState: function() {
		return {
			"typeName": this.typeName_
		}
	},

	loadExtraState: function(state) {
		this.typeName_ = state["typeName"]
		this.updateShape_()
	},

	saveConnections: function(containerBlock) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK")
		let i = 0
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock()
				continue
			}
			const input = this.getInput("DATA" + i)
			itemBlock.valueConnection_ = input && input.connection.targetConnection
			itemBlock = itemBlock.getNextBlock()
			i++
		}
	},

	updateShape_: function() {
		let typeModel = this.workspace.getTypeMap()[this.typeName_]
		let typePlaceholders = typeModel["typePlaceholders"]
		if (typePlaceholders.length && this.getInput("EMPTY")) {
			this.removeInput("EMPTY")
		}
		else if (!typePlaceholders.length && !this.getInput("EMPTY")) {
			this
				.appendDummyInput("EMPTY")
				.appendField("type " + this.typeName_)
		}

		for (let i = 0; i < typePlaceholders.length; ++i) {
			if (!this.getInput("DATA" + i)) {
				const input = this.appendValueInput("DATA" + i)
					  .setAlign(Blockly.Input.Align.RIGHT)
					  .setCheck("Type")
				if (i === 0) {
					input.appendField("type " + this.typeName_ + " with:")
				}
				input.appendField(typePlaceholders[i])
			}
		}

		for (let i = this.itemCount_; this.getInput("DATA" + i); ++i) {
			this.removeInput("DATA" + i)
		}
	}
}
Blockly.Extensions.registerMutator(
	"type_mutator",
	typeDefMutator,
	undefined,
	[]
)

const dataConstructorGetMutator = {
	dcName_: null,

	saveExtraState: function() {
		return {
			"dcName": this.dcName_
		}
	},

	loadExtraState: function(state) {
		this.dcName_ = state["dcName"]
		this.updateShape_()
	},

	saveConnections: function(containerBlock) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK")
		let i = 0
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock()
				continue
			}
			const input = this.getInput("DATA" + i)
			itemBlock.valueConnection_ = input && input.connection.targetConnection
			itemBlock = itemBlock.getNextBlock()
			i++
		}
	},

	updateShape_: function() {
		let dataConsModel = this.workspace.getDataConsMap()[this.dcName_]
		let argumentTypes = dataConsModel.getArgTypes()
		if (argumentTypes.length && this.getInput("EMPTY")) {
			this.removeInput("EMPTY")
		}
		else if (!argumentTypes.length && !this.getInput("EMPTY")) {
			this
				.appendDummyInput("EMPTY")
				.appendField(this.dcName_)
		}

		for (let i = 0; i < argumentTypes.length; ++i) {
			if (!this.getInput("DATA" + i)) {
				const input = this.appendValueInput("DATA" + i)
					  .setAlign(Blockly.Input.Align.RIGHT)
					  .setCheck("Type")
				if (i === 0) {
					input.appendField(this.dcName_)
				}
			}
		}

		for (let i = this.itemCount_; this.getInput("DATA" + i); ++i) {
			this.removeInput("DATA" + i)
		}
	}
}
Blockly.Extensions.registerMutator(
	"data_cons_get_mutator",
	dataConstructorGetMutator,
	undefined,
	[]
)

Blockly.common.defineBlocks(blocks)
