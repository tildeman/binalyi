import * as Blockly from "blockly";

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
	{
		"type": "monad_print",
		"message0": "show %1",
		"args0": [
			{
				"type": "input_value",
				"name": "VALUE"
			}
		],
		"output": "Monad",
		"colour": 160,
		"tooltip": "Print the specified text, number or other value.",
		"helpUrl": ""
	},
	{
		"type": "monad_prompt",
		"message0": "prompt for text",
		"output": null,
		"style": "text_blocks",
		"tooltip": "Prompt for user for some text.",
		"helpUrl": ""
	},
	{
		"type": "monad_putstr",
		"message0": "print %1 %2 newline",
		"args0": [
			{
				"type": "input_value",
				"name": "STR",
				"check": "String"
			},
			{
				"type": "field_dropdown",
				"name": "NEWLINE",
				"options": [
					[
						"with",
						"TRUE"
					],
					[
						"without",
						"FALSE"
					]
				]
			}
		],
		"output": "Monad",
		"style": "text_blocks",
		"tooltip": "Prints strings without ick.",
		"helpUrl": ""
	}
]);

Blockly.common.defineBlocks(blocks);
