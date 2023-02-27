// This is supposed to be an observable model for actual, pure functions, not Blockly's built-in procedures.

import * as Blockly from "blockly"
import {triggerProceduresUpdate} from "./update_procedures.js";

export class ObservableNotProcedureModel {
	id = ""
	name = ""
	parameters = []
	shouldTriggerUpdates = true

	constructor(workspace, name, id) {
		this.id = id ?? Blockly.utils.idGenerator.genUid()
		this.name = name
		this.workspace = workspace
	}

	setName(name) {
		if (name === this.name) return this
		this.name = name
		if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace) // Not sure what to do here
		return this
	}

	insertParameter(parameterModel, index) {
		if (this.parameters[index] &&
			this.parameters[index].getId() === parameterModel.getId()) {
			return this
		}

		this.parameters.splice(index, 0, parameterModel)
		parameterModel.setProcedureModel(this)

		if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace)
		return this
	}

	deleteParameter(index) {
		if (!this.parameters[index]) return this
		const oldParam = this.parameters[index]

		this.parameters.splice(index, 1)
		if (this.shouldTriggerUpdates) triggerProceduresUpdate(this.workspace)
		return this
	}

	setReturnTypes(types) {
		return this // All functions return.
	}

	setEnabled(enabled) {
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

	getParameter(index) {
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
