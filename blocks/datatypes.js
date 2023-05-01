import * as Blockly from "blockly"
import { removeType, identifyModelParams, findLegalName, rename } from "../categories/types.ts"

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
		"mutator": "tuple_type_mutator",
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
					],
					[
						"Truth",
						"Bool"
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
		"type": "types_dc_def",
		"message0": "data %1 of %2",
		"args0": [
			{
				"type": "field_input",
				"name": "NAME",
				"text": "Something"
			},
			{
				"type": "input_dummy",
				"name": "META"
			}
		],
		"extensions": [
			"data_constructor_initialization",
			"dc_context_menu_mixin",
			"disconnect_blocks_mixin",
			"dc_rename_mixin"
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
		"extensions": [
			"disconnect_blocks_mixin",
			"type_menu_mixin"
		],
		"mutator": "type_mutator",
		"tooltip": "",
		"helpUrl": ""
	},
	{
		"type": "types_dc_get",
		"output": "Type",
		"style": "loop_blocks",
		"extensions": [
			"disconnect_blocks_mixin"
		],
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
	"tuple_type_mutator",
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
	const input = this.getInput("META")
	input.appendField(new Blockly.FieldDropdown(retrieveTypeList(this.workspace)), "TYPE")
	this.getField("NAME").setValidator(rename)
	this.updateShape_()
}
Blockly.Extensions.register(
	"data_constructor_initialization",
	dataConstructorUpdateShape
)

// Blockly developers call this a factory, so you can call this retrieveTypeListFactory
function retrieveTypeList(workspace) {
	return function() {
		if (workspace.getTypeMap) {
			return Object.keys(workspace.getTypeMap()).map((v) => {return [v, v]})
		}
		return [["Undefined", "Undefined"]]
	}
}

// I want to call this a curried function, but this sounds like alien talk.
function deleteOptionCallback(block) {
	return function() {
		const workspace = block.workspace
		const typeName = block.getFieldValue("TYPE")
		removeType(workspace, typeName)
	}
}

function deleteRenameOptionCallback(block) {
	return function() {
		const workspace = block.workspace
		const typeName = block.typeName_
		removeType(workspace, typeName)
	}
}

function tmpFindNameFactory(block) {
	return function() {
		let s = prompt("What do you want to call this block?")
		if (s) alert("The closest available name: " + findLegalName(s, block))
	}
}

const typeContextMenuMixin = {
	customContextMenu: function(options) {
		options.push({
			text: "Delete Type",
			enabled: true,
			callback: deleteRenameOptionCallback(this)
		})
	}
}
Blockly.Extensions.registerMixin(
	"type_menu_mixin",
	typeContextMenuMixin
)

const dataConstructorContextMenuMixin = {
	customContextMenu: function(options) {
		options.push({
			text: "Delete Type",
			enabled: true,
			callback: deleteOptionCallback(this)
		})
		options.push({
			text: "Find a Legal Name",
			enabled: true,
			callback: tmpFindNameFactory(this)
		})
	}
}
Blockly.Extensions.registerMixin(
	"dc_context_menu_mixin",
	dataConstructorContextMenuMixin
)

const dataConstructorRenameMixin = {
	renameDataConstructor: function(oldName, newName) {
		if (oldName === this.getFieldValue("NAME")) {
			this.setFieldValue(newName, "NAME")
		}
	}
}
Blockly.Extensions.registerMixin(
	"dc_rename_mixin",
	dataConstructorRenameMixin
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
		for (let i = 0; i < this.itemCount_; ++i) {
			if (!this.getInput("DATA" + i)) {
				const input = this.appendValueInput("DATA" + i)
					  .setAlign(Blockly.Input.Align.RIGHT)
					  .setCheck("Type")
				if (i === 0) {
					input.appendField("with")
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

	updateShape_: function() {
		let typeModel = this.workspace.getTypeMap()[this.typeName_]
		let typePlaceholders = typeModel["typePlaceholders"]
		if (typePlaceholders.length && this.getInput("EMPTY")) {
			this.removeInput("EMPTY")
		}
		else if (!typePlaceholders.length && !this.getInput("EMPTY")) {
			this.appendDummyInput("EMPTY")
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
				input.appendField(typePlaceholders[i], "NAME" + i)
			}
			else {
				this.setFieldValue(typePlaceholders[i], "NAME" + i)
			}
		}

		for (let i = typePlaceholders.length; this.getInput("DATA" + i); ++i) {
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

	updateShape_: function() {
		let dataConsModel = this.workspace.getDataConsMap()[this.dcName_]
		let argumentTypes = dataConsModel.argTypes
		if (argumentTypes.length && this.getInput("EMPTY")) {
			this.removeInput("EMPTY")
		}
		else if (!argumentTypes.length) {
			if (!this.getInput("EMPTY")) {
				this.appendDummyInput("EMPTY")
					.appendField(this.dcName_, "NAME")
			}
			else {
				this.setFieldValue(this.dcName_, "NAME")
			}
		}

		for (let i = 0; i < argumentTypes.length; ++i) {
			let input = this.getInput("DATA" + i)
			if (!input) {
				input = this.appendValueInput("DATA" + i)
					  .setAlign(Blockly.Input.Align.RIGHT)
				if (i === 0) {
					input.appendField(this.dcName_, "NAME")
				}
			}
			else {
				this.setFieldValue(this.dcName_, "NAME")
			}
			input.setCheck(identifyModelParams(argumentTypes[i]))
		}

		for (let i = argumentTypes.length; this.getInput("DATA" + i); ++i) {
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

const disconnectBlocksMixin = {
	isolate: function() {
		for (let i = 0; this.getInput("DATA" + i); ++i) {
			if (this.getInput("DATA" + i).connection.targetConnection) {
				this.getInput("DATA" + i).connection.disconnect()
			}
		}
	}
}
Blockly.Extensions.registerMixin(
	"disconnect_blocks_mixin",
	disconnectBlocksMixin
)

Blockly.common.defineBlocks(blocks)
