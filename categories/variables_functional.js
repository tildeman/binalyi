import * as Blockly from "blockly"

export function functionalVarFlyoutBlocks(workspace) {
    const variableModelList = workspace.getVariablesOfType("functional")
    const xmlList = []
    if (variableModelList.length > 0) {
	const mostRecentVariable = variableModelList[variableModelList.length - 1]
	if (Blockly.Blocks["variables_set_functional"]) {
	    const block = Blockly.utils.xml.createElement("block")
	    block.setAttribute("type", "variables_set_functional")
	    block.appendChild(
		Blockly.Variables.generateVariableFieldDom(
		    mostRecentVariable
		)
	    )
	    xmlList.push(block)
	}

	if (Blockly.Blocks["variables_get_functional"]) {
	    variableModelList.sort(Blockly.VariableModel.compareByName);
	    for (let i = 0, variable; variable = variableModelList[i]; ++i) {
		const block = Blockly.utils.xml.createElement("block")
		block.setAttribute("type", "variables_get_functional")
		block.setAttribute("gap", "8")
		block.appendChild(
		    Blockly.Variables.generateVariableFieldDom(
			variable
		    )
		)
		xmlList.push(block)
	    }
	}
    }
    return xmlList
}

export function functionalVarFlyout(workspace) {
    let toolbox = []
    const button = document.createElement("button")
    button.setAttribute("text", "Create variable/function...")
    button.setAttribute("callbackKey", "VAR_FUNCTIONAL")

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
