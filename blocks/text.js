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
		"output": "Number",
		"style": "math_blocks",
		"tooltip": "Convert a parsed value into a number of given type.",
		"helpUrl": ""
	},
	{
		"type": "text_parse",
		"message0": "parse %1",
		"args0": [
			{
				"type": "input_value",
				"name": "VALUE",
				"check": [
					"String",
					"Array"
				]
			}
		],
		"output": null,
		"style": "text_blocks",
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
		"output": "String",
		"style": "text_blocks",
		"tooltip": "Converts a number to a string.",
		"helpUrl": ""
	}
])

Blockly.common.defineBlocks(blocks)
