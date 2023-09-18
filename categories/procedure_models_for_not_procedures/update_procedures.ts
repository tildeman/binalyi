// Update "procedures" - they're actually pure functions that do not follow procedures.

import * as Blockly from "blockly"

function canUpdateVariables(block: Blockly.Block): block is (Blockly.Block & {doVariableUpdate: () => void}) {
	return "doVariableUpdate" in block;
}

export function triggerProceduresUpdate(workspace: Blockly.Workspace) {
	if (workspace.isClearing) return
	for (const block of workspace.getAllBlocks(false)) {
		if (canUpdateVariables(block)) {
			block.doVariableUpdate()
		}
	}
}
