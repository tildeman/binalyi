import * as FunctionalVariables from "./variables_functional.js"
import * as MutatorListener from "./mutatorlistener.js"

export function initialize(workspace) {
	workspace.registerToolboxCategoryCallback(
		"VARIABLE_FUNCTIONAL",
		FunctionalVariables.functionalVarFlyout)

	// workspace.addChangeListener(
	// 	MutatorListener.mutatorOpenListener("function_let_mutatorarg"))

	// workspace.addChangeListener(
	// 	MutatorListener.mutatorOpenListener("variables_set_functional_mutatorarg"))
}
