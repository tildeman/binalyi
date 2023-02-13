import * as Blockly from "blockly"

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
	{
	"type": "lists_map",
	"message0": "use function %1 on list %2",
	"args0": [
		{
		"type": "input_value",
		"name": "FUNC"
		},
		{
		"type": "input_value",
		"name": "LIST"
		}
	],
	"inputsInline": true,
	"output": null,
	"colour": 260,
	"tooltip": "Maps elements from one list to another with a function.",
	"helpUrl": ""
	},
	{
	"type": "lists_filter",
	"message0": "remove elements not satisfying %1 from %2",
	"args0": [
		{
		"type": "input_value",
		"name": "COND"
		},
		{
		"type": "input_value",
		"name": "LIST"
		}
	],
	"inputsInline": true,
	"output": null,
	"colour": 260,
	"tooltip": "Filters out elements from a list.",
	"helpUrl": ""
	},
	{
	"type": "lists_range",
	"message0": "create range from %1 to %2 with difference %3",
	"args0": [
		{
		"type": "input_value",
		"name": "START",
		"check": "Number"
		},
		{
		"type": "input_value",
		"name": "STOP",
		"check": "Number"
		},
		{
		"type": "input_value",
		"name": "STEP",
		"check": "Number"
		}
	],
	"inputsInline": true,
	"output": "Array",
	"colour": 260,
	"tooltip": "Create an inclusive range of numbers.",
	"helpUrl": ""
	},
	{
	"type": "lists_create_infinite",
	"message0": "create infinite list from %1 increment by %2",
	"args0": [
		{
		"type": "input_value",
		"name": "START",
		"check": "Number"
		},
		{
		"type": "input_value",
		"name": "STEP",
		"check": "Number"
		}
	],
	"inputsInline": true,
	"output": "Array",
	"colour": 260,
	"tooltip": "Create an infinite list with specified start value and increment.",
	"helpUrl": ""
	},
	{
	"type": "lists_join",
	"message0": "%1 ++ %2",
	"args0": [
		{
		"type": "input_value",
		"name": "A",
		"check": "Array"
		},
		{
		"type": "input_value",
		"name": "B",
		"check": "Array"
		}
	],
	"inputsInline": true,
	"output": "Array",
	"colour": 260,
	"tooltip": "Combine two lists together.",
	"helpUrl": ""
	},
	{
	"type": "lists_cons",
	"message0": "%1 : %2",
	"args0": [
		{
		"type": "input_value",
		"name": "VALUE"
		},
		{
		"type": "input_value",
		"name": "LIST",
		"check": ["Array", "String"]
		}
	],
	"inputsInline": true,
	"output": "Array",
	"colour": 260,
	"tooltip": "Append a value to the head of a list.",
	"helpUrl": ""
	},
	{
	"type": "lists_fold",
	"message0": "fold with function %1 starting with %2 at the %3 of %4",
	"args0": [
		{
		"type": "input_value",
		"name": "FUNC"
		},
		{
		"type": "input_value",
		"name": "INIT"
		},
		{
		"type": "field_dropdown",
		"name": "DIRECTION",
		"options": [
			[
			"end",
			"RIGHT"
			],
			[
			"beginning",
			"LEFT"
			]
		]
		},
		{
		"type": "input_value",
		"name": "LIST",
		"check": "Array"
		}
	],
	"inputsInline": true,
	"output": null,
	"colour": 260,
	"tooltip": "Folds a list into a single value.",
	"helpUrl": ""
	}
])

Blockly.common.defineBlocks(blocks)
