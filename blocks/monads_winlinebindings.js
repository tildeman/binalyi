import * as Blockly from "blockly"

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
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
					],
					[
						"\u2190",
						"DOLET"
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
	},
	{
		"type": "monad_action_let",
		"message0": "declare variable: %1",
		"args0": [
			{
				"type": "field_input",
				"name": "NAME",
				"text": "%{BKY_VARIABLES_DEFAULT_NAME}"
			}
		],
		"previousStatement": null,
		"nextStatement": null,
		"colour": 0,
		"tooltip": "Add a variable to the block. Sponsored by variable scoping.",
		"helpUrl": "",
		"extensions": [
			"monad_validate_mixin",
			"monad_add_validator_helper"
		]
	}
])

// When Google's JavaScript makes your life much harder

const monadValidateParams = {
	validator_: function(varName) {
		const sourceBlock = this.getSourceBlock()
		const outerWs = Blockly.Mutator.findParentWs(sourceBlock.workspace)
		varName = varName.replace(/[\s\xa0]+/g, " ").replace(/^ | $/g, "")
		if (!varName) {
			return null
		}

		// We'll ignore the duplicate name check.

		// I'm not sure what's going on with mutator flyouts and arg blocks but whatever
		if (sourceBlock.isInFlyout) {
			return varName
		}

		let model = outerWs.getVariable(varName, "functional")
		if (model && model.name !== varName) {
			// Why rename on case change?
			outerWs.renameVariableById(model.getId(), varName)
		}
		if (!model) {
			model = outerWs.createVariable(varName, "functional")
			if (model && this.createdVariables_) {
				this.createdVariables_.push(model) // I wish Javascript appends on the left
			}
		}

		return varName
	},

	deleteIntermediateVars_: function(newText){
		const outerWs = Blockly.Mutator.findParentWs(this.getSourceBlock().workspace)
		if (!outerWs) {
			return // Nothing to delete
		}
		for (let i = 0; i < this.createdVariables_.length; ++i) {
			const model = this.createdVariables_[i]
			if (model.name !== newText) {
				outerWs.deleteVariableById(model.getId())
			}
		}
	}
}

Blockly.Extensions.registerMixin("monad_validate_mixin", monadValidateParams)

const monadAddValidatorHelper = function() {
	const nameField = this.getField("NAME")

	nameField.setValidator(this.validator_)

	nameField.oldShowEditorFn_ = nameField.showEditor_

	const newShowEditorFn = function() {
		this.createdVariables_ = []
		this.oldShowEditorFn_()
	}
	nameField.showEditor_ = newShowEditorFn

	nameField.onFinishEditing_ = this.deleteIntermediateVars_

	nameField.createdVariables_ = []
	nameField.onFinishEditing_("x")
}

Blockly.Extensions.register("monad_add_validator_helper", monadAddValidatorHelper)

blocks['monad_action'] = {
	init: function() {
		this.setOutput(true, "Monad")
		this.setColour(0)
		this.items_ = [null, null, null]
		this.updateShape_()
		this.setMutator(new Blockly.Mutator(["monad_action_item","monad_action_let"], this))
		this.setTooltip("Create a do-block with any number of actions.")
		this.setHelpUrl("")
	},

	saveExtraState: function() {
		return {
			'items': this.items_ // A string for let bindings, null otherwise
		}
	},

	loadExtraState: function(state) {
		this.items_ = state['items']
		this.updateShape_()
	},

	decompose: function(workspace) {
		let topBlock = workspace.newBlock('monad_action_container')
		topBlock.initSvg()

		let connection = topBlock.getInput('STACK').connection
		for (let i of this.items_) {
			let itemBlock
			if (i == null) {
				itemBlock = workspace.newBlock('monad_action_item')
			}
			else {
				itemBlock = workspace.newBlock('monad_action_let')
				itemBlock.setFieldValue(i, "NAME")
			}
			itemBlock.initSvg()
			connection.connect(itemBlock.previousConnection)
			connection = itemBlock.nextConnection
		}

		return topBlock
	},

	compose: function(topBlock) {
		let itemBlock = topBlock.getInputTargetBlock('STACK')

		let connections = []
		let toPush = []
		while (itemBlock && !itemBlock.isInsertionMarker()) {
			connections.push(itemBlock.valueConnection_)
			toPush.push(itemBlock.getFieldValue('NAME'))
			itemBlock = itemBlock.nextConnection &&
				itemBlock.nextConnection.targetBlock()
		}

		for (let i = 0; i < this.items_.length; ++i) {
			let connection = this.getInput('ADD' + i).connection.targetConnection
			if (connection && connections.indexOf(connection) == -1) {
				connection.disconnect()
			}
		}

		this.items_ = toPush
		this.updateShape_()

		for (let i = 0; i < this.items_.length; ++i) {
			Blockly.Mutator.reconnect(connections[i], this, 'ADD' + i)
		}
	},

	saveConnections: function(containerBlock) {
		let itemBlock = containerBlock.getInputTargetBlock('STACK')
		let i = 0
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock()
				continue
			}
			const input = this.getInput('ADD' + i)
			itemBlock.valueConnection_ = input && input.connection.targetConnection
			itemBlock = itemBlock.getNextBlock()
			i++
		}
	},

	updateShape_: function() {
		if (this.items_.length && this.getInput("EMPTY")) {
			this.removeInput("EMPTY")
		}
		else if (!this.items_.length && !this.getInput("EMPTY")) {
			this.appendDummyInput("EMPTY").appendField("do nothing")
		}

		for (let i = 0; i < this.items_.length; ++i) {
			let input = this.getInput('ADD' + i)
			if (!input) {
				input = this.appendValueInput('ADD' + i)
					.setAlign(Blockly.Input.Align.RIGHT)
				if (i === 0) {
					input.appendField("do:")
				}
			}


			input.removeField('LWITH' + i, true)
			input.removeField( 'WITH' + i, true)
			input.removeField('RWITH' + i, true)
			if (this.items_[i] !== null) {
				input.appendField("bind", "LWITH" + i)
					.appendField(this.items_[i], "WITH" + i)
					.appendField("to", "RWITH" + i)
				input.setCheck(null)
			}
			else {
				input.setCheck("Monad")
			}
		}

		for (let i = this.items_.length; this.getInput('ADD' + i); ++i) {
			this.removeInput('ADD' + i)
		}
	}
}

const TOOLTIPS_BY_OP = {
	"BIND": "Binds a monadic value to a function and returns a monad of equivalent type constructor. (you know, typical functor jargon)",
	"THEN": "Takes two monadic values, and returns the second. Used for chaining monads.",
	"DOLET": "Unwraps the value from a monad, then binds it to a variable in a do-block."
}

Blockly.Extensions.register(
	"monad_op_tooltip",
	Blockly.Extensions.buildTooltipForDropdown ("OP", TOOLTIPS_BY_OP)
)

Blockly.common.defineBlocks(blocks)
