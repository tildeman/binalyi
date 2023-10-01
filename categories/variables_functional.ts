import * as Blockly from "blockly"

export type VariableModelWithParamCount = Blockly.VariableModel & {
	paramCount_?: number;
}

export function generateVariableFieldDom(variableModel: Blockly.VariableModel) {
	const field = Blockly.utils.xml.createElement("field")
	field.setAttribute("name", "VAR")
	field.setAttribute("id", variableModel.getId())
	field.setAttribute("variabletype", variableModel.type)
	const name = Blockly.utils.xml.createTextNode(variableModel.name)
	field.appendChild(name)
	return field
}

export function functionalVarFlyoutBlocks(workspace: Blockly.Workspace) {
	const variableModelList = workspace.getVariablesOfType("functional")
	const jsonList: any[] = []
	if (variableModelList.length > 0) {
		const mostRecentVariable = variableModelList[variableModelList.length - 1]
		if (Blockly.Blocks["variables_set_functional"]) {
			jsonList.push({
				"kind": "block",
				"type": "variables_set_functional",
				"fields": {
					"VAR": {
						"name": mostRecentVariable.name,
						"type": "functional"
					}
				}
			})
		}

		if (Blockly.Blocks["variables_get_functional"]) {
			variableModelList.sort(Blockly.VariableModel.compareByName)
			for (let i = 0, variable: VariableModelWithParamCount; variable = variableModelList[i]; ++i) {
				jsonList.push({
					"kind": "block",
					"type": "variables_get_functional",
					"fields": {
						"VAR": {
							"name": variable.name,
							"type": "functional"
						}
					},
					"extraState": {
						"paramCount": variable.paramCount_ || 0
					}
				})
				jsonList.push({
					"kind": "sep",
					"gap": "8"
				})
			}
		}
	}
	return jsonList
}

export function functionalVarFlyout(workspace: Blockly.WorkspaceSvg) {
	let toolbox: any[] = []
	const button = {
		"kind": "button",
		"text": "Create variable/function...",
		"callbackKey": "VAR_FUNCTIONAL"
	}


	workspace.registerButtonCallback(
		"VAR_FUNCTIONAL",
		function(button: Blockly.FlyoutButton) {
			Blockly.Variables.createVariableButtonHandler(
				button.getTargetWorkspace(),
				undefined,
				"functional"
			)
		}
	)

	toolbox.push(button)

	const blockList = functionalVarFlyoutBlocks(workspace)
	toolbox = toolbox.concat(blockList)

	return toolbox
}
