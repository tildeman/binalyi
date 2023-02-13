import * as Blockly from "blockly"

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
	{
	"type": "math_cast",
	"message0": "cast %1 to %2",
	"args0": [
		{
		"type": "input_value",
		"name": "VALUE"
		},
		{
		"type": "field_dropdown",
		"name": "TYPE",
		"options": [
			[
			"big integer",
			"INTEGER"
			],
			[
			"integer",
			"INT64"
			],
			[
			"long decimal",
			"DOUBLE"
			],
			[
			"short decimal",
			"FLOAT"
			]
		]
		}
	],
	"output": null,
	"colour": 230,
	"tooltip": "",
	"helpUrl": ""
	},
	{
	"type": "text_parse",
	"message0": "parse %1",
	"args0": [
		{
		"type": "input_value",
		"name": "VALUE"
		}
	],
	"output": null,
	"colour": 160,
	"tooltip": "Parses a string. Cast to convert to a number.",
	"helpUrl": ""
	},
	{
	"type": "text_show",
	"message0": "stringify %1",
	"args0": [
		{
		"type": "input_value",
		"name": "VALUE"
		}
	],
	"output": null,
	"colour": 160,
	"tooltip": "Converts a number to a string.",
	"helpUrl": ""
	}
])

Blockly.common.defineBlocks(blocks)
