/**
 * @fileoverview Contains variable blocks with a modified "parameters" input using a text field for variables.
 * This implementation is buggy and incomplete. Expect errors and glitches.
 */

import * as Blockly from "blockly"
import { ObservableNotProcedureModel } from "../categories/procedure_models_for_not_procedures/observable_procedure_model"
import { ObservableNotParameterModel } from "../categories/procedure_models_for_not_procedures/observable_parameter_model"
import { triggerProceduresUpdate } from "../categories/procedure_models_for_not_procedures/update_procedures"
import { FBlockDefinition } from "../miscellaneous/blockdefs";
import { InputWithCreatedVariables } from "../miscellaneous/mutated_blocks";

// TODO: The names on each model in a workspace's procedure map should be unique
// TODO: Name collisions must not occur in a workspace
// TODO: Variable deletion should delete all the associated getters and setters
// TODO: Pair the variable name with the value of the variable field
// TODO: Automatically reference variable parameters in the getter, initially or on change

const BLOCK_DEFINITIONS: FBlockDefinition[] = [
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
		"type": "variables_set_functional_mutatorarg",
		"message0": "input name: %1",
		"args0": [
			{
				"type": "field_input",
				"name": "NAME",
				"text": ""
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
				"type": "field_label_serializable",
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
		"tooltip": "Declares this variable to be equal to the input. "
			+ "Do not declare twice or dire things will happen.",
		"helpUrl": "",
		"extensions": [
			"variable_functional_update_shape_mixin",
			"variable_def_var_mixin",
			"variable_dgd_mixin"
		],
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
		"tooltip": "Returns the value of this variable.",
		"helpUrl": "",
		"extensions": [
			"variable_cgd_mixin"
		],
		"mutator": "variable_call_mutator"
	}
];
const blocks = Blockly.common.createBlockDefinitionsFromJsonArray(BLOCK_DEFINITIONS);

const variableDGDMixin = function(this: VariablesSetFunctionalBlock) {
	const mixin = {
		model_: null as null | ObservableNotProcedureModel,
		name_: null as null | string,

		getProcedureModel(): ObservableNotProcedureModel | null {
			return this.model_;
		},

		isProcedureDef(this: VariablesSetFunctionalBlock) {
			return true;
		},

		getVars: function(this: VariablesSetFunctionalBlock) {
			return this.getProcedureModel()?.getParameters().map(
					(p: ObservableNotParameterModel) => p.getVariableModel().name) || [];
		},

		getVarModels: function(this: VariablesSetFunctionalBlock) {
			return this.getProcedureModel()?.getParameters().map(
				(p: ObservableNotParameterModel) => p.getVariableModel()) || [];
		},

		destroy: function(this: VariablesSetFunctionalBlock) {
			if (this.isInsertionMarker()) return;
			this.workspace.getProcedureMap().delete(this.getProcedureModel()?.getId() || "");
		}
	}

	mixin.model_ = new ObservableNotProcedureModel(
		this.workspace,
		""
	);
	// FIXME: Use a proper NotProcedure map
	// this.workspace.getProcedureMap().add(mixin.getProcedureModel() as Blockly.Procedures.IProcedureModel);

	this.mixin(mixin,true);
}
Blockly.Extensions.register(
	"variable_dgd_mixin",
	variableDGDMixin
)

const VariableUpdateShapeMixin = {
	doVariableUpdate: function(this: VariablesSetFunctionalBlock) {
		this.updateParameters_();
		this.updateMutator_();
	},

	updateParameters_: function(this: VariablesSetFunctionalBlock) {
		const params = this.getProcedureModel()?.getParameters().map(
			(p) => p.getName()) || [];
		const paramString = (params.length ? `with: ${params.join(", ")} ` : "") + "as";

		Blockly.Events.disable();
		try {
			this.setFieldValue(paramString, 'PARAMS');
		}
		finally {
			Blockly.Events.enable();
		}
	},

	updateMutator_: function(this: VariablesSetFunctionalBlock) {
		const mutatorWorkspace = this.mutator?.getWorkspace();
		if (!mutatorWorkspace) return;

		for (const p of this.getProcedureModel()?.getParameters() || []) {
			const block = mutatorWorkspace.getBlockById(p.getId());
			if (!block) continue;
			if (block.getFieldValue("NAME") !== p.getName()) {
				block.setFieldValue(p.getName(), "NAME");
			}
		}
	}
}
Blockly.Extensions.registerMixin(
	"variable_functional_update_shape_mixin",
	VariableUpdateShapeMixin
)

type VariablesSetFunctionalBlock = Blockly.BlockSvg & IVariablesSetFunctional;
interface IVariablesSetFunctional extends VariablesSetFunctionalType {}
type VariablesSetFunctionalType = typeof VariableUpdateShapeMixin & typeof VariableDefMutator & VariablesDefGetDefMixin & VariablesDefVarMixin;

interface VariablesDefGetDefMixin {
	model_: ObservableNotProcedureModel | null;
	name_: string | null;
	getProcedureModel(this: VariablesSetFunctionalBlock): ObservableNotProcedureModel | null;
	isProcedureDef(this: VariablesSetFunctionalBlock): boolean;
	getVars: (this: VariablesSetFunctionalBlock) => string[];
	getVarModels: (this: VariablesSetFunctionalBlock) => Blockly.VariableModel[];
	destroy: (this: VariablesSetFunctionalBlock) => void;
}
interface VariablesDefVarMixin {
	renameVarById: (this: VariablesSetFunctionalBlock, oldId: string, newId: string) => void;
	updateVarName: (this: VariablesSetFunctionalBlock, variable: Blockly.VariableModel) => void;
}

type VariablesSetFunctionalItemBlock = Blockly.BlockSvg & {
	valueConnection_: Blockly.Connection | null
};

const VariableDefVarMixin = function() {
	const mixin = {
		renameVarById: function(this: VariablesSetFunctionalBlock, oldId: string, newId: string) {
			const oldVar = this.workspace.getVariableById(oldId);
			const model = this.getProcedureModel();
			const index = model?.getParameters().findIndex(
				(p) => p.getVariableModel() === oldVar) || -1;
			if (index == -1 || !model) return;
			const newVar = this.workspace.getVariableById(newId);
			const oldParam = model.getParameter(index);
			model.deleteParameter(index);
			model.insertParameter(
				new ObservableNotParameterModel(
					this.workspace, newVar?.name || "", oldParam.getId()),
				index);
		},

		updateVarName: function(this: VariablesSetFunctionalBlock, variable: Blockly.VariableModel) {
			const containsVar = this.getProcedureModel()?.getParameters().some(
				(p) => p.getVariableModel() === variable
			)
			if (containsVar) {
				triggerProceduresUpdate(this.workspace)
			}
		}
	}

	this.mixin(mixin, true)
}
Blockly.Extensions.register(
	"variable_def_var_mixin",
	VariableDefVarMixin
)

const VariableDefMutator = {

	saveExtraState: function(this: VariablesSetFunctionalBlock){
		const state = Object.create(null);
		state["variableId"] = this.getFieldValue("VAR");
		state["name"] = this.name_;

		const params = this.getProcedureModel()?.getParameters() || [];

		if (params.length) {
			state["params"] = params.map((p) => {
				return {
					"name": this.name_,
					"id": p.getVariableModel().getId(),
					"paramId": p.getId(),
				};
			});
		}

		return state;
	},

	loadExtraState: function(this: VariablesSetFunctionalBlock, state: any){
		const map = this.workspace.getProcedureMap()
		const procedureId = state['variableId']
		console.log(procedureId)
		if (!this.model_) {
			this.model_ = new ObservableNotProcedureModel(
				this.workspace, ""
			);
		}
		console.log(this.model_.getId())
		if (procedureId && procedureId != this.model_.getId() &&
			map.has(procedureId) &&
			(this.isInsertionMarker())) {
			console.log("yes!");
			if (map.has(this.model_.getId())) {
				map.delete(this.model_.getId());
			}
			// FIXME: Workspace doesn't have a dedicated function for NotProcedures
			this.model_ = (map.get(procedureId) || null) as ObservableNotProcedureModel | null;
		}
		this.name_ = state["name"];
		console.log(state);
		this.model_?.setName(this.name_ || "");

		if (state["params"]) {
			for (let i = 0; i < state["params"].length; i++) {
				const {name, id, paramId} = state["params"][i];
				this.getProcedureModel()?.insertParameter(
					new ObservableNotParameterModel(this.workspace, name, paramId, id), i);
			}
		}

		this.doVariableUpdate();
	},

	decompose: function(this: VariablesSetFunctionalBlock, workspace: Blockly.WorkspaceSvg) {
		const variableId = this.getFieldValue("VAR")
		const containerBlockDef = {
			"type": "variables_get_functional_container",
			"inputs": {
				"STACK": {}
			}
		};

		let connDef = containerBlockDef["inputs"]["STACK"];
		const model = this.getProcedureModel();
		if (model) {
			for (const param of model.getParameters()) {
				connDef["block"] = {
					"type": "variables_set_functional_mutatorarg",
					"id": param.getId(),
					"fields": {
						"NAME": param.getName()
					},
					"next": {}
				};
				connDef = connDef["block"]["next"];
			}
		}

		const containerBlock = Blockly.serialization.blocks.append(
			containerBlockDef, workspace, {recordUndo: false});

		return containerBlock;
	},

	compose: function(this: VariablesSetFunctionalBlock, containerBlock: Blockly.Block) {
		const model = this.getProcedureModel();
		if (!model) return;
		const count = Object.keys(model).length;
		console.log(this.getFieldValue("VAR"));
		model.startBulkUpdate();
		for (let i = count - 1; i >= 0; -- i) {
			model.deleteParameter(i);
		}

		let i = 0;
		let paramBlock = containerBlock.getInputTargetBlock("STACK");
		while (paramBlock && !paramBlock.isInsertionMarker()) {
			model.insertParameter(
				new ObservableNotParameterModel(
					this.workspace, paramBlock.getFieldValue("NAME"), paramBlock.id),
				i);
			paramBlock = paramBlock.nextConnection &&
				paramBlock.nextConnection.targetBlock();
			++i;
		}
		model.endBulkUpdate();
	}
};
Blockly.Extensions.registerMutator(
	"variable_def_mutator",
	VariableDefMutator,
	undefined,
	["variables_set_functional_mutatorarg"]
);

type VariablesMutatorArgumentBlock = Blockly.BlockSvg & IVariablesMutatorArgument;
interface IVariablesMutatorArgument extends VariablesMutatorArgumentType {}
type VariablesMutatorArgumentType = typeof ValidateVariableParamMixin;

const ValidateVariableParamMixin = {

	validator_: function(this: InputWithCreatedVariables, varName: string) {
		const sourceBlock = this.getSourceBlock();
		const outerWs = sourceBlock.workspace.getRootWorkspace();
		varName = varName.replace(/[\s\xa0]/g, " ").replace(/^ | $/g, "");
		if (!varName || !outerWs) {
			return null;
		}

		const workspace = (sourceBlock.workspace as Blockly.WorkspaceSvg).targetWorkspace ||
			  sourceBlock.workspace as Blockly.WorkspaceSvg;
		const blocks = workspace.getAllBlocks(false);
		const caselessName = varName.toLowerCase();
		for (let i = 0; i < blocks.length; ++i) {
			if (blocks[i].id === this.getSourceBlock().id) {
				continue;
			}
			const otherVar = blocks[i].getFieldValue("NAME");
			if (otherVar && otherVar.toLowerCase() === caselessName) {
				return null;
			}
		}

		if (sourceBlock.isInFlyout) {
			return varName;
		}
		
		let model = outerWs.getVariable(varName, "functional");
		if (model && model.name !== varName) {
			outerWs.renameVariableById(model.getId(), varName);
		}
		if (!model) {
			model = outerWs.createVariable(varName, "functional");
			if (model && this.createdVariables_) {
				this.createdVariables_.push(model);
			}
		}

		return varName;
	},

	deleteImmediateVars_: function(this: InputWithCreatedVariables, newText: string) {
		const outerWs = this.getSourceBlock().workspace.getRootWorkspace();
		if (!outerWs) {
			return
		}
		for (let i = 0; i < this.createdVariables_.length; ++i) {
			const model = this.createdVariables_[i];
			if (model.name !== newText) {
				outerWs.deleteVariableById(model.getId());
			}
		}
	}
};
Blockly.Extensions.registerMixin(
	"variable_functional_mutatorarg_validate_mixin",
	ValidateVariableParamMixin
);

const addValidatorToParamFieldHelper = function(this: VariablesMutatorArgumentBlock) {
	const nameField = this.getField("NAME");

	nameField?.setValidator(this.validator_);
}
Blockly.Extensions.register(
	"variable_functional_mutatorarg_add_validator_helper",
	addValidatorToParamFieldHelper
);

type VariablesGetFunctionalBlock = Blockly.BlockSvg & IVariablesGetFunctional;
interface IVariablesGetFunctional extends VariablesGetFunctionalType {}
type VariablesGetFunctionalType = typeof VariableUpdateShapeMixin & typeof VariableCallMutator & VariablesCallGetDefMixin;

interface VariablesCallGetDefMixin {
	model_: ObservableNotProcedureModel | null;
	getProcedureModel(this: VariablesGetFunctionalBlock): any;
	findNotProcedureModel_(this: VariablesGetFunctionalBlock, name: string, params?: never[]): any;
	getTargetWorkspace_(this: VariablesGetFunctionalBlock): Blockly.WorkspaceSvg | null;
	isProcedureDef(this: VariablesGetFunctionalBlock): boolean;
	getVars: (this: VariablesGetFunctionalBlock) => any;
	getVarModels: (this: VariablesGetFunctionalBlock) => any;
}

const variableCGDMixin = function() {
	const mixin = {
		model_: null as ObservableNotProcedureModel | null,

		getProcedureModel(this: VariablesGetFunctionalBlock) {
			return this.model_;
		},

		findNotProcedureModel_(this: VariablesGetFunctionalBlock, name: string, params = []) {
			const workspace = this.getTargetWorkspace_();
			const model = workspace?.getProcedureMap().getProcedures().find(
				(proc) => proc.getName() === name);
			console.log(workspace?.getProcedureMap().getProcedures());
			if (!model) return null;
			return model;
		},

		getTargetWorkspace_(this: VariablesGetFunctionalBlock) {
			return this.workspace.isFlyout ?
				this.workspace.targetWorkspace :
				this.workspace;
		},

		isProcedureDef(this: VariablesGetFunctionalBlock) {
			return true;
		},

		getVars: function(this: VariablesGetFunctionalBlock) {
			return this.getProcedureModel().getParameters().map(
				(p: ObservableNotParameterModel) => p.getVariableModel().name);
		},

		getVarModels: function(this: VariablesGetFunctionalBlock) {
			return this.getProcedureModel().getParameters().map(
				(p: ObservableNotParameterModel) => p.getVariableModel());
		}
	}

	this.mixin(mixin,true)
}
Blockly.Extensions.register(
	"variable_cgd_mixin",
	variableCGDMixin
)

const VariableCallMutator = {
	itemCount_: 0,
	name_: "",
	
	saveExtraState: function(this: VariablesGetFunctionalBlock) {
		const state = {
			"itemCount": this.itemCount_,
			"name": this.name_
		};
		const model = this.getProcedureModel();
		if (!model) return state;
		return state;
	},

	loadExtraState: function(this: VariablesGetFunctionalBlock, state: any) {
		this.itemCount_ = state["itemCount"];
		this.name_ = state["name"];

		if (!this.model_) this.model_ = this.findNotProcedureModel_(this.name_, []);

		this.updateShape_();
	},

	decompose: function(this: VariablesGetFunctionalBlock, workspace: Blockly.WorkspaceSvg) {
		const containerBlock = workspace.newBlock("variables_get_functional_container");
		containerBlock.initSvg();
		let connection = containerBlock.getInput("STACK")?.connection;
		for (let i = 0; i < this.itemCount_; ++i) {
			const itemBlock = workspace.newBlock("variables_get_functional_mutatorarg");
			itemBlock.initSvg();
			connection?.connect(itemBlock.previousConnection);
			connection = itemBlock.nextConnection;
		}
		return containerBlock;
	},

	compose: function(this: VariablesGetFunctionalBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK");
		const connections: (Blockly.Connection | null)[] = [];
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			connections.push((itemBlock as VariablesSetFunctionalItemBlock).valueConnection_);
			itemBlock = itemBlock.getNextBlock();
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			const connection = this.getInput("ARG" + i)?.connection?.targetConnection
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect()
			}
		}
		this.itemCount_ = connections.length
		this.updateShape_()

		for (let i = 0; i < this.itemCount_; ++i) {
			connections[i]?.reconnect(this, "ARG" + i)
		}
	},

	saveConnections: function(this: VariablesGetFunctionalBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK");
		let i = 0;
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			const input = this.getInput("ARG" + i);
			(itemBlock as VariablesSetFunctionalItemBlock).valueConnection_
				= input && input.connection?.targetConnection || null;
			itemBlock = itemBlock.getNextBlock();
			i++;
		}
	},

	updateShape_: function(this: VariablesGetFunctionalBlock) {
		let oldId = this.getFieldValue("VAR");

		let oldName = "%{BKY_VARIABLES_DEFAULT_NAME}";
		if (oldId) {
			oldName = this.workspace.getVariableById(oldId)?.name || "";
		}
		console.log(this.model_);

		let targetBlock = null;
		if (this.getInput("EXPR")) {
			this.removeInput("EXPR");
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			if (!this.getInput("ARG" + i)) {
				const input = this.appendValueInput("ARG" + i)
					  .setAlign(Blockly.inputs.Align.RIGHT);
				if (i === 0) {
					input.appendField(
						new Blockly.FieldVariable(
							oldName,
							undefined,
							["functional"],
							"functional"
						),
						"VAR"
					).appendField("with:");
				}
			}
			
		}

		for (let i = this.itemCount_; this.getInput("ARG" + i); i++) {
			this.removeInput("ARG" + i);
		}

		if (!this.itemCount_) {
			this.appendDummyInput("EXPR")
				.appendField(
					new Blockly.FieldVariable(
						oldName,
						undefined,
						["functional"],
						"functional"
					),
					"VAR"
				);
		}
	}
};
Blockly.Extensions.registerMutator(
	"variable_call_mutator",
	VariableCallMutator,
	undefined,
	["variables_get_functional_mutatorarg"]
);

const variableUpdateShape = function() {
	this.updateShape_();
}
Blockly.Extensions.register(
	"variable_functional_update_shape",
	variableUpdateShape
);

Blockly.common.defineBlocks(blocks);
