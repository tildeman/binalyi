import * as Blockly from "blockly"

export function generateVariableFieldDom(variableModel) {
	const field = Blockly.utils.xml.createElement("field")
	field.setAttribute("name", "VAR")
	field.setAttribute("id", variableModel.getId())
	field.setAttribute("variabletype", variableModel.type)
	const name = Blockly.utils.xml.createTextNode(variableModel.name)
	field.appendChild(name)
	return field
}

export function functionalVarFlyoutBlocks(workspace) {
	const variableModelList = workspace.getVariablesOfType("functional")
	const xmlList = []
	if (variableModelList.length > 0) {
		const mostRecentVariable = variableModelList[variableModelList.length - 1]
		if (Blockly.Blocks["variables_set_functional"]) {
			//const block = Blockly.utils.xml.createElement("block")
			//block.setAttribute("type", "variables_set_functional")
			//block.appendChild(
			//	Blockly.Variables.generateVariableFieldDom(
			//		mostRecentVariable
			//	)
			//)
			//xmlList.push(block)
			xmlList.push({
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
			for (let i = 0, variable; variable = variableModelList[i]; ++i) {
				//const block = Blockly.utils.xml.createElement("block")
				//block.setAttribute("type", "variables_get_functional")
				//block.setAttribute("gap", "8")
				//block.appendChild(
				//	generateVariableFieldDom(variable)
				//)

				//const mutation = Blockly.utils.xml.createElement("mutation")
				//mutation.setAttribute("name", variable.name)
				//block.appendChild(mutation)
				//xmlList.push(block)
				xmlList.push({
					"kind": "block",
					"type": "variables_get_functional",
					"fields": {
						"VAR": {
							"name": variable.name,
							"type": "functional"
						}
					},
					"extraState": {
						"name": variable.name
					}
				})
				xmlList.push({
					"kind": "sep",
					"gap": "8"
				})
			}
		}
	}
	return xmlList
}

export function functionalVarFlyout(workspace) {
	let toolbox = []
	// const button = document.createElement("button")
	// button.setAttribute("text", "Create variable/function...")
	// button.setAttribute("callbackKey", "VAR_FUNCTIONAL")
	const button = {
		"kind": "button",
		"text": "Create variable/function...",
		"callbackKey": "VAR_FUNCTIONAL"
	}


	workspace.registerButtonCallback(
	"VAR_FUNCTIONAL",
	function(button) {
		Blockly.Variables.createVariableButtonHandler(
		button.getTargetWorkspace(),
		null,
		"functional"
		)
	}
	)

	toolbox.push(button)

	const blockList = functionalVarFlyoutBlocks(workspace)
	toolbox = toolbox.concat(blockList)
	
	return toolbox
}
