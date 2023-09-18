import * as Blockly from "blockly"
import { Block } from "blockly"

// That stupid bug still lingers...

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
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
				"name": "NAME"
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
])

const letMutator = {
	params_: [],

	saveExtraState: function() {
		return {
			"params": this.params_
		}
	},

	loadExtraState: function(state) {
		this.params_ = state["params"]
		this.updateShape_()
	},

	decompose: function(workspace) {
		const containerBlockDef = {
			"type": "function_let_container",
			"inputs": {
				"STACK": {}
			}
		}

		let connDef = containerBlockDef["inputs"]["STACK"]
		for (const param of this.params_) {
			connDef["block"] = {
				"type": "function_let_mutatorarg",
				"id": param["id"],
				"fields": {
					"NAME": param["name"]
				},
				"next": {}
			}
			connDef = connDef["block"]["next"]
		}

		const containerBlock = Blockly.serialization.blocks.append(
			containerBlockDef,
			workspace,
			{recordUndo: false}
		)

		return containerBlock
	},

	compose: function(containerBlock) {
		const count = this.params_.length

		let newModel = []
		let i = 0;
		let paramBlock = containerBlock.getInputTargetBlock("STACK")
		while (paramBlock && !paramBlock.isInsertionMarker()) {
			newModel.push({
				"id": paramBlock.id,
				"name": paramBlock.getFieldValue("NAME")
			})
			paramBlock = paramBlock.nextConnection
				&& paramBlock.nextConnection.targetBlock()
			++i
		}
		this.params_ = newModel
		this.updateShape_()
	},

	saveConnections: function(containerBlock) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK")
		let i = 0
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()){
				itemBlock = itemBlock.getNextBlock()
				continue
			}
			const input = this.getInput("LET" + i)
			itemBlock.valueConnection_ = input && input.connection.targetConnection
			itemBlock = itemBlock.getNextBlock()
			i++
		}
	},

	updateShape_: function() {
		let targetBlock = null
		if (this.getInput("EXP")) {
			targetBlock = this.getInput("EXP").connection.targetBlock()
			this.removeInput("EXP")
		}

		for (let i = 0; i < this.params_.length; ++i) {
			let input = this.getInput("LET" + i)
			if (!input) {
				input = this.appendValueInput("LET" + i)
					.setAlign(Blockly.inputs.Align.RIGHT)
				if (i === 0) {
					// Unpopular opinion: use Python syntax for let bindings
					input.appendField("with")
				}
				input.appendField(
						this.params_[i]["name"],
						"NAME" + i
					)
					.appendField("as")
			}

			this.setFieldValue(this.params_[i]["name"], "NAME" + i)
		}

		for (let i = this.params_.length; this.getInput("LET" + i); ++i) {
			this.removeInput("LET" + i)
		}

		const expr = this.appendValueInput("EXP")
			  .setAlign(Blockly.inputs.Align.RIGHT)
		if (targetBlock) {
			expr.connection.connect(targetBlock.outputConnection)
		}
		if (!this.params_.length) {
			expr.appendField("with nothing")
		}
		expr.appendField("run")
	}
}
Blockly.Extensions.registerMutator(
	"let_mutator",
	letMutator,
	undefined,
	["function_let_mutatorarg"]
)

const validateLetBindingMixin = {
	validator_: function(varName) {
		const sourceBlock = this.getSourceBlock()
		const outerWs = Blockly.Mutator.findParentWs(sourceBlock.workspace)
		varName = varName.replace(/[\s\xa0]+/g, " ").replace(/^ | $/g, "")
		if (!varName) {
			return null
		}

		const workspace = sourceBlock.workspace.targetWorkspace
			  || sourceBlock.workspace
		const blocks = workspace.getAllBlocks(false)
		const caselessName = varName.toLowerCase() // Thank god
		for (let i = 0; i < blocks.length; ++i) {
			if (blocks[i].id === this.getSourceBlock().id) {
				continue
			}

			const otherVar = blocks[i].getFieldValue("NAME")
			if (otherVar && otherVar.toLowerCase() === caselessName) {
				return null
			}
		}

		if (sourceBlock.isInFlyout) {
			return varName
		}

		// Let bindings only deals with "Functional" vartype
		let model = outerWs.getVariable(varName, "functional")
		if (model && model.name !== varName) {
			// Following Haskell's convention of lowercase names and titlecase classes
			outerWs.renameVariableById(model.getId(), varName)
		}
		if (!model) {
			model = outerWs.createVariable(varName, "functional")
			if (model && this.createdVariables_) {
				this.createdVariables_.push(model)
			}
		}

		return varName
	},

	// If the answer is wrong, modify the answer key in your favor
	// - China, in response to cartography and WGS-84
	deleteImmediateVars_: function(newText) {
		const outerWs = Blockly.Mutator.findParentWs(this.getSourceBlock().workspace)
		if (!outerWs) {
			return
		}
		for (let i = 0; i < this.createdVariables_.length; ++i) {
			const model = this.createdVariables_[i]
			if (model.name !== newText) {
				outerWs.deleteVariableById(model.getId())
			}
		}
	}
}
Blockly.Extensions.registerMixin(
	"function_let_mutatorarg_validate_mixin",
	validateLetBindingMixin
)

const addValidatorToLetBindingHelper = function() {
	const nameField = this.getField("NAME")

	nameField.setValidator(this.validator_)

	nameField.oldShowEditorFn_ = nameField.showEditor_

	const newShowEditorFn = function() {
		this.createdVariables_ = []
		this.oldShowEditorFn_()
	}
	nameField.showEditor_ = newShowEditorFn
	nameField.onFinishEditing_ = this.deleteImmediateVars_
	nameField.createdVariables_ = []
	nameField.onFinishEditing_("x")
}
Blockly.Extensions.register(
	"function_let_mutatorarg_add_validator_helper",
	addValidatorToLetBindingHelper
)

// It's an informal name, but please forget about it
function updateShapeLikeATrueList() {
	this.updateShape_()
}
Blockly.Extensions.register(
	"function_let_post_initialization",
	updateShapeLikeATrueList
)

Blockly.common.defineBlocks(blocks)
