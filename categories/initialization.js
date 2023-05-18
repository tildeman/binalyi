import * as FunctionalVariables from "./variables_functional"
import * as Datatypes from "./types"
import * as MutatorListener from "./mutatorlistener"

export function initialize(workspace) {
	workspace.registerToolboxCategoryCallback(
		"VARIABLE_FUNCTIONAL",
		FunctionalVariables.functionalVarFlyout)

	workspace.registerToolboxCategoryCallback(
		"DATATYPE",
		Datatypes.typeFlyout)

	workspace.addChangeListener(
		Datatypes.updateModels(workspace)
	)

	const flyoutwsp = workspace.getFlyout().getWorkspace()
	flyoutwsp.typeMap = workspace.typeMap = {
		types: {},
		dataConstructors: {},
	}
	flyoutwsp.getTypeMap = workspace.getTypeMap = function(){
		return this.typeMap.types
	}
	flyoutwsp.setTypeMap = workspace.setTypeMap = function(typename, value){
		this.typeMap.types[typename] = value
	}
	flyoutwsp.getDataConsMap = workspace.getDataConsMap = function(){
		return this.typeMap.dataConstructors
	}
	flyoutwsp.setDataConsMap = workspace.setDataConsMap = function(typename, value){
		this.typeMap.dataConstructors[typename] = value
	}
}
