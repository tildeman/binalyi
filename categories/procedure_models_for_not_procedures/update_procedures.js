// Update "procedures" - they're actually pure functions that do not follow procedures.

import * as Blockly from "blockly"

export function triggerProceduresUpdate(workspace) {
	if (workspace.isClearing) return
	for (const block of workspace.getAllBlocks(false)) {
		if (block.doVariableUpdate !== undefined) {
			block.doVariableUpdate()
		}
	}
}
