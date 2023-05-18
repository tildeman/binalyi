import * as Blockly from "blockly"

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
	{
		"type": "variables_get_functional_container",
		"message0": "inputs %1 %2",
		"args0": [
			{
				"type": "input_dummy"
			},
			{
				"type": "input_statement",
				"name": "STACK"
			}
		],
		"style": "variable_blocks",
		"tooltip": "Add, remove, or reorder inputs to this (maybe) function",
		"helpUrl": "",
		"enableContextMenu": false
	},
	{
		"type": "variables_get_functional_mutatorarg",
		"message0": "input",
		"previousStatement": null,
		"nextStatement": null,
		"style": "variable_blocks",
		"tooltip": "Add an argument to the function call.",
		"helpUrl": "",
		"enableContextMenu": false
	},
	{
		"type": "variables_set_functional",
		"message0": "declare %1 as %2",
		"args0": [
			{
				"type": "field_variable",
				"name": "VAR",
				"variable": "item"
			},
			{
				"type": "input_value",
				"name": "EXPR"
			}
		],
		"previousStatement": "Decl",
		"nextStatement": "Decl",
		"style": "variable_blocks",
		"tooltip": "Declares this variable (with parameters) to be equal to the input. Do not redeclare or dire things will happen.",
		"helpUrl": "",
		"mutator": "variable_def_mutator"
	},
	{
		"type": "variables_get_functional",
		"message0": "%1 %2",
		"args0": [
			{
				"type": "field_variable",
				"name": "VAR",
				"variable": "item"
			},
			{
				"type": "input_dummy",
				"name": "EXPR"
			}
		],
		"output": null,
		"style": "variable_blocks",
		"tooltip": "Returns the value of this variable with provided arguments.",
		"helpUrl": "",
		"mutator": "variable_def_mutator",
		"extensions": [
			"load_param_count"
		]
	}
])

const variableDefMutator = {
	paramCount_: 0,

	saveExtraState: function() {
		return {
			"paramCount": this.paramCount_
		}
	},

	loadExtraState: function(state) {
		this.paramCount_ = state["paramCount"]
		this.updateShape_()
	},

	decompose: function(workspace) {
		const containerBlock = workspace.newBlock("variables_get_functional_container")
		containerBlock.initSvg()
		let connection = containerBlock.getInput("STACK").connection
		for (let i = 0; i < this.paramCount_; ++i) {
			const itemBlock = workspace.newBlock("variables_get_functional_mutatorarg")
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

		for (let i = 0; i < this.paramCount_; ++i) {
			const connection = this.getInput("ADD" + i).connection.targetConnection
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect()
			}
		}
		this.paramCount_ = connections.length
		this.updateShape_()

		for (let i = 0; i < this.paramCount_; ++i) {
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
			++i
		}
	},

	updateShape_: function() {
		let oldId = this.getFieldValue("VAR")

		let oldName = "%{BKY_VARIABLES_DEFAULT_NAME}"
		if (oldId) {
			oldName = this.workspace.getVariableById(oldId).name
		}

		let targetBlock = null
		if (this.getInput("EXPR")) {
			if (this.type[10] == 's') {
				targetBlock = this
					.getInput("EXPR")
					.connection
					.targetBlock()
			}
			this.removeInput("EXPR")
		}

		// Spaghetti code
		for (let i = 0; i < this.paramCount_; ++i) {
			if (!this.getInput("ADD" + i)) {
				const input = this.appendValueInput("ADD" + i)
					  .setAlign(Blockly.Input.Align.RIGHT)
				if (i === 0) {
					if (this.type[10] == 's') {
						input.appendField("declare")
							.appendField(
								new Blockly.FieldVariable(
									oldName,
									null,
									["functional"],
									"functional"
								),
								"VAR"
							)
							.appendField("with")
					}
					else {
						input.appendField(
							new Blockly.FieldVariable(
								oldName,
								null,
								["functional"],
								"functional"
							),
							"VAR"
						)
					}
				}
			}
		}

		for (let i = this.paramCount_; this.getInput("ADD" + i); i++) {
			this.removeInput("ADD" + i)
		}

		if (this.type[10] == 's') {
			const expr = this.appendValueInput("EXPR")
				  .setAlign(Blockly.Input.Align.RIGHT)
			if(targetBlock) {
				expr.connection.connect(targetBlock.outputConnection)
			}
			if (!this.paramCount_) {
				expr.appendField("declare")
					.appendField(
						new Blockly.FieldVariable(
							oldName,
							null,
							["functional"],
							"functional"
						),
						"VAR"
					)
			}
			expr.appendField("as")

			const varId = this.getFieldValue("VAR")
			const variable = this.workspace.getVariableById(varId)
			if (variable) variable.paramCount_ = this.paramCount_
		}
		else if (!this.paramCount_) {
			this.appendDummyInput("EXPR")
				.appendField(
					new Blockly.FieldVariable(
						oldName,
						null,
						["functional"],
						"functional"
					),
					"VAR"
				)
		}
	}
}
Blockly.Extensions.registerMutator(
	"variable_def_mutator",
	variableDefMutator,
	undefined,
	["variables_get_functional_mutatorarg"]
)

function loadParamCount() {
	this.updateShape_()
}
Blockly.Extensions.register(
	"load_param_count",
	loadParamCount
)

Blockly.common.defineBlocks(blocks)
