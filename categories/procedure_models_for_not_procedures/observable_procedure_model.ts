// This is supposed to be an observable model for actual, pure functions, not Blockly's built-in procedures.

import * as Blockly from "blockly"
import { triggerProceduresUpdate } from "./update_procedures.js";
import { ObservableNotParameterModel } from "./observable_parameter_model.js";

export class ObservableNotProcedureModel {
	id: string
	name: string
	parameters: ObservableNotParameterModel[] = []
	shouldTriggerUpdates = true
	workspace: Blockly.Workspace

	constructor(workspace: Blockly.Workspace, name: string, id?: string) {
		this.id = id ?? Blockly.utils.idGenerator.genUid()
		this.name = name
		this.workspace = workspace
	}

	setName(name: string) {
		if (name === this.name) return this
		this.name = name
		if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace) // Not sure what to do here
		return this
	}

	insertParameter(parameterModel: ObservableNotParameterModel, index: number) {
		if (this.parameters[index] &&
			this.parameters[index].getId() === parameterModel.getId()) {
			return this
		}

		this.parameters.splice(index, 0, parameterModel)
		parameterModel.setProcedureModel(this)

		if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace)
		return this
	}

	deleteParameter(index: number) {
		if (!this.parameters[index]) return this

		this.parameters.splice(index, 1)
		if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace)
		return this
	}

	setReturnTypes(types: string[]) {
		return this // All functions return.
	}

	setEnabled(enabled: boolean) {
		return this // Variables here need not disabling
	}

	// Helper functions for bulk updating
	startBulkUpdate() {
		this.shouldTriggerUpdates = false
	}

	endBulkUpdate() {
		this.shouldTriggerUpdates = true
		triggerProceduresUpdate(this.workspace)
	}

	getId() {
		return this.id
	}

	getName() {
		return this.name
	}

	getParameter(index: number) {
		return this.parameters[index]
	}

	getParameters() {
		return [...this.parameters]
	}

	getReturnTypes() {
		return [] // Again, all functions return.
	}

	getEnabled() {
		return true
	}
}
