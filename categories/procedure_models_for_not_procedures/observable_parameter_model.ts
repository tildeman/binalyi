// First-class curried functions triumph

import * as Blockly from "blockly"
import { ObservableNotProcedureModel } from "./observable_procedure_model"

export class ObservableNotParameterModel {
	id: string
	variable: Blockly.VariableModel
	procedureModel?: ObservableNotProcedureModel
	workspace: Blockly.Workspace

	constructor(workspace: Blockly.Workspace, name: string, id: string, varId?: string | null) {
		this.id = id ?? Blockly.utils.idGenerator.genUid()
		this.workspace = workspace
		this.variable = this.workspace.getVariable(name) ??
			workspace.createVariable(name, "functional", varId) // The only line I'd change
	}

	setName(name: string) {
		if (name === this.variable.name) return this
		const oldName = this.variable.name
		this.variable = this.workspace.getVariable(name) ??
			this.workspace.createVariable(name, "functional")
		let a = 9
		return this
	}

	setTypes(_types: any) {
		throw new Error(
			"The ParameterModel provided with the component does not support typing. " +
				"Go away and think something better"
		)
	}

	getName() {
		return this.variable.name
	}

	getTypes() {
		return []
	}

	getId() {
		return this.id
	}

	getVariableModel() {
		return this.variable
	}

	setProcedureModel(model: ObservableNotProcedureModel) {
		this.procedureModel = model
		return this
	}
}
