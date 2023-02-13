import * as Blockly from "blockly"
import { Block } from "blockly"

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
	{
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
		"message0": "binding",
		"previousStatement": null,
		"nextStatement": null,
		"colour": 290,
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
		"colour": 290,
		"tooltip": "",
		"helpUrl": ""
	}
])

const letMutator = {
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
		const containerBlock = workspace.newBlock('function_let_container')
		containerBlock.initSvg()
		let connection = containerBlock.getInput('STACK').connection
		for (let i = 0; i < this.itemCount_; ++i) {
			const itemBlock = workspace.newBlock('function_let_mutatorarg')
			itemBlock.initSvg()
			connection.connect(itemBlock.previousConnection)
			connection = itemBlock.nextConnection
		}
		return containerBlock
	},

	compose: function(containerBlock) {
		let itemBlock = containerBlock.getInputTargetBlock('STACK')
		const connections = [] // This array deals with LET inputs
		const snoitcennoc = [] // This array deals with AS  inputs
		for (let i = 0; itemBlock; ++i) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock()
				continue
			}
			let valcon = itemBlock.valueConnection_
			if (!valcon){
				valcon = [null, null]
			}

			connections.push(valcon[0])
			snoitcennoc.push(valcon[1])

			itemBlock = itemBlock.getNextBlock()
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			const connection = this.getInput('LET' + i).connection.targetConnection
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect()
			}

			const noitcennoc = this.getInput("AS"  + i).connection.targetConnection
			if (noitcennoc && snoitcennoc.indexOf(noitcennoc) === -1) {
				noitcennoc.disconnect()
			}
		}
		this.itemCount_ = connections.length
		this.updateShape_()

		for (let i = 0; i < this.itemCount_; ++i) {
			Blockly.Mutator.reconnect(connections[i], this, 'LET' + i)
			Blockly.Mutator.reconnect(snoitcennoc[i], this, "AS"  + i)
		}
	},

	saveConnections: function(containerBlock) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK")
		let i = 0
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()){
				itemBlock = itemBlock.getNextBlock()
				continue
			}
			const letinput = this.getInput("LET" + i)
			const asinput  = this.getInput("AS"  + i)
			itemBlock.valueConnection_ = [
				letinput && letinput.connection.targetConnection,
				 asinput &&  asinput.connection.targetConnection
			]
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

		for (let i = 0; i < this.itemCount_; ++i) {
			let input = this.getInput("LET" + i)
			if (!input) {
				input = this.appendValueInput("LET" + i)
					.setAlign(Blockly.Input.Align.RIGHT)
				if (i === 0) {
					// Unpopular opinion: use Python syntax for let bindings
					input.appendField("with")
				}
				else {
					input.appendField("and")
				}

				this.appendValueInput("AS" + i)
					.setAlign(Blockly.Input.Align.RIGHT)
					.appendField("as")
			}
		}

		for (let i = this.itemCount_; this.getInput("LET" + i); ++i) {
			this.removeInput("LET" + i)
			this.removeInput("AS" + i)
		}

		const expr = this.appendValueInput("EXP")
			  .setAlign(Blockly.Input.Align.RIGHT)
		if (targetBlock) {
			expr.connection.connect(targetBlock.outputConnection)
		}
		if (!this.itemCount_) {
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

// It's an informal name, but please forget about it
function updateShapeLikeATrueList() {
	this.updateShape_()
}
Blockly.Extensions.register(
	"function_let_post_initialization",
	updateShapeLikeATrueList
)

Blockly.common.defineBlocks(blocks)
