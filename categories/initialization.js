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

	// workspace.addChangeListener(
	// 	MutatorListener.mutatorOpenListener("function_let_mutatorarg"))

	// workspace.addChangeListener(
	// 	MutatorListener.mutatorOpenListener("variables_set_functional_mutatorarg"))
}
