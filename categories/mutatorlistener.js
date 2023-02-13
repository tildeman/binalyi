import * as Blockly from "blockly"

// Curried function, don't ask why
export function mutatorOpenListener(blockType) {
	let updateMutatorFlyout = function(workspace) {
		const usedNames = []
		const blocks = workspace.getBlocksByType(blockType, false)
		for (let i = 0, block; block = blocks[i]; ++i) {
			usedNames.push(block.getFieldValue("NAME"))
		}

		const xmlElement = Blockly.utils.xml.createElement("xml")
		const argBlock = Blockly.utils.xml.createElement("block")
		argBlock.setAttribute("type", blockType)
		const nameField = Blockly.utils.xml.createElement("field")
		nameField.setAttribute("name", "NAME")
		const argValue = Blockly.Variables.generateUniqueNameFromOptions(
			"x",
			usedNames
		)
		const fieldContent = Blockly.utils.xml.createTextNode(argValue)

		nameField.appendChild(fieldContent)
		argBlock.appendChild(nameField)
		xmlElement.appendChild(argBlock)

		workspace.updateToolbox(xmlElement)
	}

	let mutatorChangeListener = function(e) {
		if (e.type !== Blockly.Events.BLOCK_CREATE &&
			e.type !== Blockly.Events.BLOCK_DELETE &&
			e.type !== Blockly.Events.BLOCK_CHANGE) {
			return
		}
		const workspaceId = e.workspaceId
		const workspace = Blockly.common.getWorkspaceById(workspaceId)
		updateMutatorFlyout(workspace)
	}

	return function(e) {
		if (e.type !== Blockly.Events.BUBBLE_OPEN) {
			return
		}
		const bubbleEvent = e
		if (!(bubbleEvent.bubbleType === "mutator" && bubbleEvent.isOpen) ||
			!bubbleEvent.blockId) {
			return
		}
		const workspaceId = bubbleEvent.workspaceId
		const blockWs = Blockly.common.getWorkspaceById(workspaceId)
		const block = blockWs && blockWs.getBlockById(bubbleEvent.blockId)
		const type = block.type
		const bloodlet = blockType.substring(0, blockType.length - 11)
		if (type !== bloodlet) {
			return
		}
		const workspaceMut = block.mutator
		const workspace = workspaceMut && workspaceMut.getWorkspace()
		updateMutatorFlyout(workspace)
		workspace.addChangeListener(mutatorChangeListener)
	}
}
