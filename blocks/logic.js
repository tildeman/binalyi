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
	"colour": 210,
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
	"colour": 210,
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
	"colour": 210,
	"tooltip": "Fallback when no other patterns match.",
	"helpUrl": ""
	},
	{
	"type": "logic_wildcard",
	"message0": "_",
	"output": null,
	"colour": 210,
	"tooltip": "Dummy pattern that matches everything but binds to nothing.",
	"helpUrl": ""
	}
])

Blockly.common.defineBlocks(blocks)
