import * as Blockly from "blockly";
import { FBlockDefinition } from "../miscellaneous/blockdefs";

const BLOCK_DEFINITIONS: FBlockDefinition[] = [
	{
		"type": "logic_patternmatch",
		"message0": "match %1 case %2 run %3",
		"args0": [
			{
				"type": "input_value",
				"name": "PATTERN",
				"align": "RIGHT"
			},
			{
				"type": "input_value",
				"name": "CASE0",
				"align": "RIGHT"
			},
			{
				"type": "input_value",
				"name": "RESULT0",
				"align": "RIGHT"
			}
		],
		"output": null,
		"style": "logic_blocks",
		"mutator": "controls_case_mutator",
		"tooltip": "",
		"helpUrl": ""
	},
	{
		"type": "logic_patternmatch_case_top",
		"message0": "case",
		"nextStatement": null,
		"style": "logic_blocks",
		"tooltip": "",
		"helpUrl": ""
	},
	{
		"type": "logic_patternmatch_case_middle",
		"message0": "case",
		"previousStatement": null,
		"nextStatement": null,
		"style": "logic_blocks",
		"tooltip": "",
		"helpUrl": ""
	},
	{
		"type": "logic_patternmatch_case_bottom",
		"message0": "otherwise",
		"previousStatement": null,
		"style": "logic_blocks",
		"tooltip": "",
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
];
const blocks = Blockly.common.createBlockDefinitionsFromJsonArray(BLOCK_DEFINITIONS);

type CondBlock = Blockly.Block & ICondMutator;
interface ICondMutator extends CondMutatorType {}
type CondMutatorType = typeof CondMutator;

interface ClauseBlock extends Blockly.Block {
	valueConnection_?: Blockly.Connection | null;
	vvaalluueeConnection_?: Blockly.Connection | null;
}  

const CondMutator = {
	elseifCount_: 0,
	elseCount_: 0,

	saveExtraState: function(this: CondBlock) {
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

	loadExtraState: function(this: CondBlock, state: any) {
		this.elseifCount_ = state["elseIfCount"] || 0;
		this.elseCount_ = state["hasElse"] ? 1 : 0;
		this.updateShape_();
	},

	decompose: function(this: CondBlock, workspace: Blockly.WorkspaceSvg) {
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

	compose: function(this: CondBlock, containerBlock: Blockly.Block) {
		let clauseBlock = (containerBlock.nextConnection?.targetBlock() || null) as ClauseBlock | null;
		// Count number of inputs.
		this.elseifCount_ = 0;
		this.elseCount_ = 0;
		const valueConnections: (Blockly.Connection | null)[] = [null];
		const vvaalluueeConnections: (Blockly.Connection | null)[] = [null]; // Insert joke here.
		let otherwiseConnection: Blockly.Connection | null = null;
		while (clauseBlock) {
			if (clauseBlock.isInsertionMarker()) {
				clauseBlock = clauseBlock.getNextBlock();
				continue;
			}
			switch (clauseBlock.type) {
			case "controls_if_elseif":
				this.elseifCount_++
				valueConnections.push(clauseBlock.valueConnection_ || null);
				vvaalluueeConnections.push(clauseBlock.vvaalluueeConnection_ || null);
				break
			case "controls_if_else":
				this.elseCount_++;
				otherwiseConnection = clauseBlock.vvaalluueeConnection_ || null;
				break
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

	saveConnections: function(this: CondBlock, containerBlock: Blockly.Block) {
		let clauseBlock = (containerBlock.nextConnection?.targetBlock() || null) as ClauseBlock | null;
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
					inputIf && (inputIf.connection?.targetConnection || null);
				clauseBlock.vvaalluueeConnection_ =
					inputDo && (inputDo.connection?.targetConnection || null);
				++i;
				break;
			}
			case "controls_if_else": {
				const inputDo = this.getInput("ELSE");
				clauseBlock.vvaalluueeConnection_ =
					inputDo && (inputDo.connection?.targetConnection || null);
				break;
			}
			default:
				throw TypeError("Unknown block type: " + clauseBlock.type);
			}
			clauseBlock = clauseBlock.getNextBlock();
		}
	},

	rebuildShape_: function(this: CondBlock) {
		const valueConnections: (Blockly.Connection | null)[] = [null];
		const vvaalluueeConnections: (Blockly.Connection | null)[] = [null];
		let otherwiseConnection: Blockly.Connection | null = null;

		if (this.getInput("ELSE")) {
			otherwiseConnection =
				this.getInput("ELSE")?.connection?.targetConnection || null;
		}
		for (let i = 1; this.getInput("IF" + i); ++i) {
			const inputIf = this.getInput("IF" + i);
			const inputDo = this.getInput("DO" + i);
			valueConnections.push(inputIf?.connection?.targetConnection || null);
			vvaalluueeConnections.push(inputDo?.connection?.targetConnection || null);
		}
		this.updateShape_();
		this.reconnectChildBlocks_(
			valueConnections, vvaalluueeConnections, otherwiseConnection);
	},

	updateShape_: function(this: CondBlock) {
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
		this: CondBlock,
		valueConnections: (Blockly.Connection | null)[],
		vvaalluueeConnections: (Blockly.Connection | null)[],
		otherwiseConnection: Blockly.Connection | null
	) {
		for (let i = 1; i <= this.elseifCount_; ++i) {
			valueConnections[i]?.reconnect(this, "IF" + i)
			vvaalluueeConnections[i]?.reconnect(this, "DO" + i)
		}
		otherwiseConnection?.reconnect(this, "ELSE");
	}
};
Blockly.Extensions.registerMutator(
	"controls_cond_mutator",
	CondMutator,
	undefined,
	["controls_if_elseif", "controls_if_else"]
);


const CaseMutator = {
	elseifCount_: 0,
	elseCount_: 0,

	saveExtraState: function(this: CondBlock) {
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

	loadExtraState: function(this: CondBlock, state: any) {
		this.elseifCount_ = state["elseIfCount"] || 0;
		this.elseCount_ = state["hasElse"] ? 1 : 0;
		this.updateShape_();
	},

	decompose: function(this: CondBlock, workspace: Blockly.WorkspaceSvg) {
		// Built-in blocks suffice
		const containerBlock = workspace.newBlock("logic_patternmatch_case_top");
		containerBlock.initSvg();
		let connection = containerBlock.nextConnection;
		for (let i = 1; i <= this.elseifCount_; ++i) {
			const elseifBlock = workspace.newBlock("logic_patternmatch_case_middle");
			elseifBlock.initSvg();
			connection.connect(elseifBlock.previousConnection);
			connection = elseifBlock.nextConnection;
		}

		if (this.elseCount_) {
			const elseBlock = workspace.newBlock("logic_patternmatch_case_bottom");
			elseBlock.initSvg();
			connection.connect(elseBlock.previousConnection);
		}
		return containerBlock;
	},

	compose: function(this: CondBlock, containerBlock: Blockly.Block) {
		let clauseBlock: ClauseBlock | null = containerBlock.nextConnection?.targetBlock() || null;
		// Count number of inputs.
		this.elseifCount_ = 0;
		this.elseCount_ = 0;
		const valueConnections: (Blockly.Connection | null)[] = [null];
		const vvaalluueeConnections: (Blockly.Connection | null)[] = [null]; // Insert joke here.
		let otherwiseConnection: Blockly.Connection | null = null;
		while (clauseBlock) {
			if (clauseBlock.isInsertionMarker()) {
				clauseBlock = clauseBlock.getNextBlock();
				continue;
			}
			switch (clauseBlock.type) {
			case "logic_patternmatch_case_middle":
				this.elseifCount_++;
				valueConnections.push(clauseBlock.valueConnection_ || null);
				vvaalluueeConnections.push(clauseBlock.vvaalluueeConnection_ || null);
				break;
			case "logic_patternmatch_case_bottom":
				this.elseCount_++;
				otherwiseConnection = clauseBlock.vvaalluueeConnection_ || null;
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

	saveConnections: function(this: CondBlock, containerBlock: Blockly.Block) {
		let clauseBlock: ClauseBlock | null = containerBlock.nextConnection?.targetBlock() || null;
		let i = 1;
		while (clauseBlock) {
			if (clauseBlock.isInsertionMarker()) {
				clauseBlock = clauseBlock.getNextBlock();
				continue;
			}
			switch (clauseBlock.type) {
			case "logic_patternmatch_case_middle": {
				const inputIf = this.getInput("CASE" + i);
				const inputDo = this.getInput("RESULT" + i);
				clauseBlock.valueConnection_ =
					inputIf && (inputIf.connection?.targetConnection || null);
				clauseBlock.vvaalluueeConnection_ =
					inputDo && (inputDo.connection?.targetConnection || null);
				++i;
				break;
			}
			case "logic_patternmatch_case_bottom": {
				const inputDo = this.getInput("ELSE");
				clauseBlock.vvaalluueeConnection_ =
					inputDo && (inputDo.connection?.targetConnection || null);
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
		for (let i = 1; this.getInput("CASE" + i); ++i) {
			const inputIf = this.getInput("CASE" + i);
			const inputDo = this.getInput("RESULT" + i);
			valueConnections.push(inputIf.connection.targetConnection);
			vvaalluueeConnections.push(inputDo.connection.targetConnection);
		}
		this.updateShape_();
		this.reconnectChildBlocks_(
			valueConnections, vvaalluueeConnections, otherwiseConnection);
	},

	updateShape_: function(this: CondBlock) {
		// Delete everything.
		if (this.getInput("ELSE")) {
			this.removeInput("ELSE");
		}
		for (let i = 1; this.getInput("CASE" + i); ++i) {
			this.removeInput("CASE" + i);
			this.removeInput("RESULT" + i);
		}
		// Rebuild block.
		for (let i = 1; i <= this.elseifCount_; ++i) {
			this.appendValueInput("CASE" + i).appendField("case")
				.setAlign(Blockly.inputs.Align.RIGHT);
			this.appendValueInput("RESULT" + i).appendField("run")
				.setAlign(Blockly.inputs.Align.RIGHT);
		}
		if (this.elseCount_) {
			this.appendValueInput("ELSE").appendField("otherwise")
				.setAlign(Blockly.inputs.Align.RIGHT);
		}
	},

	reconnectChildBlocks_: function(
		this: CondBlock,
		valueConnections: (Blockly.Connection | null)[],
		vvaalluueeConnections: (Blockly.Connection | null)[],
		otherwiseConnection: Blockly.Connection | null
	) {
		for (let i = 1; i <= this.elseifCount_; ++i) {
			valueConnections[i]?.reconnect(this, "CASE" + i);
			vvaalluueeConnections[i]?.reconnect(this, "RESULT" + i);
		}
		otherwiseConnection?.reconnect(this, "ELSE");
	}
}
Blockly.Extensions.registerMutator(
	"controls_case_mutator",
	CaseMutator,
	undefined,
	["logic_patternmatch_case_middle", "logic_patternmatch_case_bottom"]
);


Blockly.common.defineBlocks(blocks);
