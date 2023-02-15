import * as Blockly from "blockly"

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
	{
		"type": "patmat_tree",
		"message0": "pattern match %1 against %2",
		"args0": [
			{
				"type": "input_value",
				"name": "NAME"
			},
			{
				"type": "input_statement",
				"name": "CASES",
				"check": "Pattern"
			}
		],
		"output": null,
		"style": "logic_blocks",
		"tooltip": "Pat a Mat jsou bratři.",
		"helpUrl": ""
	},
	{
		"type": "patmat_pattern",
		"message0": "case %1 → %2",
		"args0": [
			{
				"type": "input_value",
				"name": "PATTERN"
			},
			{
				"type": "input_value",
				"name": "VALUE"
			}
		],
		"inputsInline": true,
		"previousStatement": "Pattern",
		"nextStatement": "Pattern",
		"style": "logic_blocks",
		"tooltip": "The pattern to be matched",
		"helpUrl": ""
	},
	{
		"type": "patmat_default",
		"message0": "default → %1",
		"args0": [
			{
				"type": "input_value",
				"name": "VALUE"
			}
		],
		"previousStatement": "Pattern",
		"style": "logic_blocks",
		"tooltip": "Fallback when no other patterns match.",
		"helpUrl": ""
	},
	{
		"type": "logic_wildcard",
		"message0": "_",
		"output": null,
		"style": "logic_blocks",
		"tooltip": "Dummy pattern that matches everything but binds to nothing.",
		"helpUrl": ""
	},
	{
		"type": "logic_cond",
		"message0": "if %1 then %2",
		"args0": [
			{
				"type": "input_value",
				"name": "IF0",
				"check": "Boolean"
			},
			{
				"type": "input_value",
				"name": "DO0"
			}
		],
		"output": null,
		"style": "logic_blocks",
		"mutator": "controls_cond_mutator",
		"tooltip": "An if-else with multiple conditions",
		"helpUrl": ""
	}
])

const CondMutator = {
	elseifCount_: 0,
	elseCount_: 0,

	saveExtraState: function() {
		if (!this.elseifCount_ && !this.elseCount_) {
			return null;
		}
		const state = Object.create(null);
		if (this.elseifCount_) {
			state["elseIfCount"] = this.elseifCount_;
		}
		if (this.elseCount_) {
			state["hasElse"] = true;
		}
		return state;
	},

	loadExtraState: function(state) {
		this.elseifCount_ = state["elseIfCount"] || 0;
		this.elseCount_ = state["hasElse"] ? 1 : 0;
		this.updateShape_();
	},

	decompose: function(workspace) {
		// Built-in blocks suffice
		const containerBlock = workspace.newBlock("controls_if_if");
		containerBlock.initSvg();
		let connection = containerBlock.nextConnection;
		for (let i = 1; i <= this.elseifCount_; ++i) {
			const elseifBlock = workspace.newBlock("controls_if_elseif");
			elseifBlock.initSvg();
			connection.connect(elseifBlock.previousConnection);
			connection = elseifBlock.nextConnection;
		}

		if (this.elseCount_) {
			const elseBlock = workspace.newBlock("controls_if_else");
			elseBlock.initSvg();
			connection.connect(elseBlock.previousConnection);
		}
		return containerBlock;
	},

	compose: function(containerBlock) {
		let clauseBlock = containerBlock.nextConnection.targetBlock();
		// Count number of inputs.
		this.elseifCount_ = 0;
		this.elseCount_ = 0;
		const valueConnections = [null];
		const vvaalluueeConnections = [null]; // Insert joke here.
		let otherwiseConnection = null;
		while (clauseBlock) {
			if (clauseBlock.isInsertionMarker()) {
				clauseBlock = clauseBlock.getNextBlock();
				continue;
			}
			switch (clauseBlock.type) {
			case "controls_if_elseif":
				this.elseifCount_++;
				valueConnections.push(clauseBlock.valueConnection_);
				vvaalluueeConnections.push(clauseBlock.vvaalluueeConnection_);
				break;
			case "controls_if_else":
				this.elseCount_++;
				otherwiseConnection = clauseBlock.vvaalluueeConnection_;
				break;
			default:
				throw TypeError("Unknown block type: " + clauseBlock.type);
			}
			clauseBlock = clauseBlock.getNextBlock();
		}
		this.updateShape_();
		// Reconnect any child blocks.
		this.reconnectChildBlocks_(
			valueConnections, vvaalluueeConnections, otherwiseConnection);
	},

	saveConnections: function(containerBlock) {
		let clauseBlock = containerBlock.nextConnection.targetBlock();
		let i = 1;
		while (clauseBlock) {
			if (clauseBlock.isInsertionMarker()) {
				clauseBlock = clauseBlock.getNextBlock();
				continue;
			}
			switch (clauseBlock.type) {
			case "controls_if_elseif": {
				const inputIf = this.getInput("IF" + i);
				const inputDo = this.getInput("DO" + i);
				clauseBlock.valueConnection_ =
					inputIf && inputIf.connection.targetConnection;
				clauseBlock.vvaalluueeConnection_ =
					inputDo && inputDo.connection.targetConnection;
				++i;
				break;
			}
			case "controls_if_else": {
				const inputDo = this.getInput("ELSE");
				clauseBlock.vvaalluueeConnection_ =
					inputDo && inputDo.connection.targetConnection;
				break;
			}
			default:
				throw TypeError("Unknown block type: " + clauseBlock.type);
			}
			clauseBlock = clauseBlock.getNextBlock();
		}
	},

	rebuildShape_: function() {
		const valueConnections = [null];
		const vvaalluueeConnections = [null];
		let otherwiseConnection = null;

		if (this.getInput("ELSE")) {
			otherwiseConnection =
				this.getInput("ELSE").connection.targetConnection;
		}
		for (let i = 1; this.getInput("IF" + i); ++i) {
			const inputIf = this.getInput("IF" + i);
			const inputDo = this.getInput("DO" + i);
			valueConnections.push(inputIf.connection.targetConnection);
			vvaalluueeConnections.push(inputDo.connection.targetConnection);
		}
		this.updateShape_();
		this.reconnectChildBlocks_(
			valueConnections, vvaalluueeConnections, otherwiseConnection);
	},

	updateShape_: function() {
		// Delete everything.
		if (this.getInput("ELSE")) {
			this.removeInput("ELSE");
		}
		for (let i = 1; this.getInput("IF" + i); ++i) {
			this.removeInput("IF" + i);
			this.removeInput("DO" + i);
		}
		// Rebuild block.
		for (let i = 1; i <= this.elseifCount_; ++i) {
			this.appendValueInput("IF" + i).setCheck("Boolean").appendField(
				Blockly.Msg["CONTROLS_IF_MSG_ELSEIF"]);
			this.appendValueInput("DO" + i).appendField("then");
		}
		if (this.elseCount_) {
			this.appendValueInput("ELSE").appendField(
				Blockly.Msg["CONTROLS_IF_MSG_ELSE"]);
		}
	},

	reconnectChildBlocks_: function(
		valueConnections,
		vvaalluueeConnections,
		otherwiseConnection
	) {
		for (let i = 1; i <= this.elseifCount_; ++i) {
			Blockly.Mutator.reconnect(valueConnections[i], this, "IF" + i);
			Blockly.Mutator.reconnect(vvaalluueeConnections[i], this, "DO" + i);
		}
		Blockly.Mutator.reconnect(otherwiseConnection, this, "ELSE");
	}
}
Blockly.Extensions.registerMutator(
    'controls_cond_mutator',
	CondMutator,
	null,
    ['controls_if_elseif', 'controls_if_else']
);

Blockly.common.defineBlocks(blocks)
