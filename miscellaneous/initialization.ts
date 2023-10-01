import * as FunctionalVariables from "../categories/variables_functional"
import * as Datatypes from "../categories/types"
import { Events, IFlyout } from "blockly"

export function initialize(workspace: Datatypes.TypeWorkspace) {
	workspace.registerToolboxCategoryCallback(
		"VARIABLE_FUNCTIONAL",
		FunctionalVariables.functionalVarFlyout);

	workspace.registerToolboxCategoryCallback(
		"DATATYPE",
		Datatypes.typeFlyout);

	workspace.addChangeListener(
		// BlockAny is not assignable to Blockly.Event.Abstract because f*** you
		Datatypes.updateModels(workspace) as (e: Events.Abstract) => void
	);

	const flyout: IFlyout | null = workspace.getFlyout();
	if (!flyout) return;
	const flyoutwsp = flyout.getWorkspace() as Datatypes.TypeWorkspace;
	flyoutwsp.typeMap = workspace.typeMap = {
		types: {},
		dataConstructors: {},
	};
	flyoutwsp.getTypeMap = workspace.getTypeMap = function(){
		return this.typeMap.types;
	}
	flyoutwsp.setTypeMap = workspace.setTypeMap = function(typename, value){
		this.typeMap.types[typename] = value;
	}
	flyoutwsp.getDataConsMap = workspace.getDataConsMap = function(){
		return this.typeMap.dataConstructors;
	}
	flyoutwsp.setDataConsMap = workspace.setDataConsMap = function(typename, value){
		this.typeMap.dataConstructors[typename] = value;
	}
}
