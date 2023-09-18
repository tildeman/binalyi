import * as Blockly from "blockly";
import { FBlockDefinition } from "../miscellaneous/blockdefs";

const BLOCK_DEFINITIONS: FBlockDefinition[] = [
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
		"style": "list_blocks",
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
		"style": "list_blocks",
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
		"style": "list_blocks",
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
		"style": "list_blocks",
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
				"check": ["Array", "String"]
			},
			{
				"type": "input_value",
				"name": "B",
				"check": ["Array", "String"]
			}
		],
		"inputsInline": true,
		"output": "Array",
		"style": "list_blocks",
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
		"style": "list_blocks",
		"tooltip": "Append a value to the head of a list.",
		"helpUrl": ""
	},
	{
		"type": "lists_fold",
		"message0": "collect with function %1 starting with %2 as the %3 operand %4 on %5",
		"args0": [
			{
				"type": "input_value",
				"name": "FUNC",
				"align": "RIGHT"
			},
			{
				"type": "input_value",
				"name": "INIT",
				"align": "RIGHT"
			},
			{
				"type": "field_dropdown",
				"name": "DIRECTION",
				"options": [
					[
						"second",
						"RIGHT"
					],
					[
						"first",
						"LEFT"
					]
				]
			},
			{
				"type": "input_dummy",
				"align": "RIGHT"
			},
			{
				"type": "input_value",
				"name": "LIST",
				"align": "RIGHT",
				"check": "Array"
			}
		],
		"inputsInline": false,
		"output": null,
		"style": "list_blocks",
		"tooltip": "Folds a list into a single value.",
		"helpUrl": ""
	},
	{
		"type": "list_opad",
		"message0": "%1 of %2",
		"args0": [
			{
				"type": "field_dropdown",
				"name": "ACC",
				"options": [
					[
						"first",
						"FIRST"
					],
					[
						"rest",
						"REST"
					]
				]
			},
			{
				"type": "input_value",
				"name": "NAME",
				"check": [
					"String",
					"Array"
				]
			}
		],
		"output": null,
		"style": "list_blocks",
		"extensions": [
			"list_op_tooltip"
		],
		"helpUrl": ""
	}
];
const blocks = Blockly.common.createBlockDefinitionsFromJsonArray(BLOCK_DEFINITIONS);

const TOOLTIPS_BY_AXEN = {
	"FIRST": "Return the first element of a list.",
	"REST": "Return the list with the first element removed."
};
Blockly.Extensions.register(
	"list_op_tooltip",
	Blockly.Extensions.buildTooltipForDropdown("ACC", TOOLTIPS_BY_AXEN)
);

Blockly.common.defineBlocks(blocks);
