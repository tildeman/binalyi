import * as Blockly from "blockly"

// That stupid bug still lingers...

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
		"type": "variables_set_functional_mutatorarg", // TODO: Validate input name
		"message0": "input name: %1",
		"args0": [
			{
				"type": "field_input",
				"name": "NAME"
			}
		],
		"previousStatement": null,
		"nextStatement": null,
		"style": "variable_blocks",
		"tooltip": "Add an input to the function.",
		"helpUrl": "",
		"enableContextMenu": false,
		"extensions": [
			"variable_functional_mutatorarg_validate_mixin",
			"variable_functional_mutatorarg_add_validator_helper"
		]
	},
	{
		"type": "variables_get_functional_mutatorarg",
		"message0": "input",
		"previousStatement": null,
		"nextStatement": null,
		"style": "variable_blocks",
		"tooltip": "Add an argument to the function call.",
		"helpUrl": ""
	},
	{
		"type": "variables_set_functional",
		"message0": "declare %1 %2 %3",
		"args0": [
			{
				"type": "field_variable",
				"name": "VAR",
				"variable": "item"
			},
			{
				"type": "field_label",
				"name": "PARAMS",
				"text": "as"
			},
			{
				"type": "input_value",
				"name": "NAME"
			}
		],
		"previousStatement": null,
		"nextStatement": null,
		"style": "variable_blocks",
		"tooltip": "Declares this variable to be equal to the input. Do not declare twice or dire things will happen.",
		"helpUrl": "",
		"extensions": [
			"variable_functional_caller_set_def_mixin",
			"variable_functional_update_shape_mixin",
			"variable_def_var_mixin"
		],
		"mutator": "variable_def_mutator"
	},
	{
		"type": "variables_get_functional",
		"message0": "%1",
		"args0": [
			{
				"type": "field_variable",
				"name": "VAR",
				"variable": "item"
			}
		],
		"output": null,
		"style": "variable_blocks",
		"tooltip": "Returns the value of this variable.",
		"helpUrl": ""
	}
])

// Blockly procedures fall short to first-class curried higher-order functions
// Structure: {"<workspaceId>": {"<name>": [{"name","paramId"}]}}
const CALLABLE_VARIABLES = Object.create(null)

const variableCallerSetDefMixin = {
	defVarIfNotExist: function(k) {
		if ((Object.keys(CALLABLE_VARIABLES).indexOf(this.workspace.id)) === -1) {
			CALLABLE_VARIABLES[this.workspace.id] = Object.create(null)
		}
		if ((Object.keys(CALLABLE_VARIABLES[this.workspace.id]).indexOf(k)) === -1) {
			CALLABLE_VARIABLES[this.workspace.id][k] = []
		}
	},

	getParams: function(k) {
		return CALLABLE_VARIABLES[this.workspace.id][k]
	},
	setParams: function(k,s) {
		CALLABLE_VARIABLES[this.workspace.id][k] = s
	},

	getCurrParams: function() {
		return this.getParams(this.getFieldValue("VAR"))
	}
}
Blockly.Extensions.registerMixin(
	"variable_functional_caller_set_def_mixin",
	variableCallerSetDefMixin
)

const variableUpdateShapeMixin = {
	doVariableUpdate: function() {
		// Variable names do not collide
		this.updateParameters_()
		this.updateMutator_()
	},

	updateParameters_: function() {
		this.defVarIfNotExist(this.getFieldValue("VAR"))
		const params = this.getCurrParams().map((p) => p["name"])
		const paramString = (params.length ? `with: ${params.join(", ")} ` : "") + "as"

		// "Firing is unnecessary for event-deterministic fields" - Google
		Blockly.Events.disable()
		try {
			this.setFieldValue(paramString, 'PARAMS')
		}
		finally {
			Blockly.Events.enable()
		}
	},

	updateMutator_: function() {
		if (!this.mutator?.isVisible()) return

		const mutatorWorkspace = this.mutator.getWorkspace()
		for (const p of this.getCurrParams()) {
			const block = mutatorWorkspace.getBlockById(p["paramId"])
			if (!block) continue
			if (block.getFieldValue("NAME") !== p["name"]) {
				block.setFieldValue(p["name"], "NAME")
			} 
		}
	}
}


Blockly.Extensions.registerMixin(
	"variable_functional_update_shape_mixin",
	variableUpdateShapeMixin
)


const variableDefMutator = {
	saveExtraState: function(){
		const state = Object.create(null)
		state["variableId"] = this.getFieldValue("VAR")

		this.defVarIfNotExist(state["variableId"])

		const params = this.getParams(state["variableId"])

		if (params && params.length) {
			state["params"] = params
		}

		return state
	},

	loadExtraState: function(state){
		const map = this.workspace.getVariableMap()
		const variableId = state["variableId"]

		if (state["params"]) {
			this.setParams(variableId, state["params"])
		}
	},

	decompose: function(workspace) {
		const variableId = this.getFieldValue("VAR")
		const containerBlockDef = {
			"type": "variables_get_functional_container",
			"inputs": {
				"STACK": {}
			}
		}

		this.defVarIfNotExist(variableId)

		let connDef = containerBlockDef["inputs"]["STACK"]
		for (const param of this.getParams(variableId)) {
			connDef["block"] = {
				"type": "variables_set_functional_mutatorarg",
				"id": param["paramId"],
				"fields": {
					"NAME": param["name"]
				},
				"next": {}
			}
			connDef = connDef["block"]["next"]
		}

		const containerBlock = Blockly.serialization.blocks.append(
			containerBlockDef, workspace, {recordUndo: false})

		return containerBlock
	},

	compose: function(containerBlock) {
		// Blockly has procedures; procedures have models
		// When life gives you janky abstractions, pick something else.
		const variableId = this.getFieldValue("VAR")
		this.setParams(variableId, [])
		const model = CALLABLE_VARIABLES[this.workspace.id][variableId]
		const count = Object.keys(model).length

		let i = 0
		let paramBlock = containerBlock.getInputTargetBlock("STACK")
		while (paramBlock && !paramBlock.isInsertionMarker()) {
			model.push({
				"name": paramBlock.getFieldValue("NAME"),
				"paramId": paramBlock.id
			})
			paramBlock = paramBlock.nextConnection && paramBlock.nextConnection.targetBlock()
			++i
		}

		this.doVariableUpdate()
	}
}
Blockly.Extensions.registerMutator(
	"variable_def_mutator",
	variableDefMutator,
	undefined,
	["variables_set_functional_mutatorarg"]
)

const variableDefVarMixin = function() {
	const mixin = {
		renameVarById: function(oldId, newId) {
			console.log(1) // Will this ever run
			const model = this.getCurrParams();
			const index = model.findIndex((p) => p.paramId === oldId)
			if (index === -1) return
			const newVar = this.workspace.getVariableById(newId)
			const oldParam = model[index]
			model[index]=[newVar.name, oldParam.paramId]
		},

		updateVarName: function(variable) {
			const containsVar = this.getCurrParams().some(
				(p) => p.paramId === variable.id_
			)
			console.log(this.getCurrParams())
			console.log(variable.name)
			if (containsVar) {
				this.doVariableUpdate()
			}
		}
	}

	this.mixin(mixin, true)
}
Blockly.Extensions.register(
	"variable_def_var_mixin",
	variableDefVarMixin
)

// Mutator arguments that also declare variable names
// Substantial amounts of code are taken from Blockly's source code

const validateVariableParamMixin = {
	validator_: function(varName) {
		const sourceBlock = this.getSourceBlock()
		const outerWs = Blockly.Mutator.findParentWs(sourceBlock.workspace)
		varName = varName.replace(/[\s\xa0]/g, " ").replace(/^ | $/g, "")
		if (!varName) {
			return null
		}

		const workspace = sourceBlock.workspace.targetWorkspace ||
			  sourceBlock.workspace
		const blocks = workspace.getAllBlocks(false)
		const caselessName = varName.toLowerCase()
		for (let i = 0; i < blocks.length; ++i) {
			if (blocks[i].id === this.getSourceBlock().id) {
				continue
			}
			// Blockly seems to enforce case-insensitive names
			// Might be great for code generation
			const otherVar = blocks[i].getFieldValue("NAME")
			if (otherVar && otherVar.toLowerCase() === caselessName) {
				return null
			}
		}
		
		// Blocks in mutator's flyout don't deserve variable declarations
		if (sourceBlock.isInFlyout) {
			return varName
		}
		
		let model = outerWs.getVariable(varName, "functional")
		if (model && model.name !== varName) {
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

	// If your answer is wrong, modify the answer key in your favor
	// Much like the Chinese GPS
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
	"variable_functional_mutatorarg_validate_mixin",
	validateVariableParamMixin
)

const addValidatorToParamFieldHelper = function() {
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
	"variable_functional_mutatorarg_add_validator_helper",
	addValidatorToParamFieldHelper
)

Blockly.common.defineBlocks(blocks)
