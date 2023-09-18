import * as Blockly from "blockly";

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
	{
		"type": "text_parse",
		"message0": "parse %1",
		"args0": [
			{
				"type": "input_value",
				"name": "TEXT",
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
	},
	{
		"type": "text_charops",
		"message0": "%1 of %2",
		"args0": [
			{
				"type": "field_dropdown",
				"name": "ACTION",
				"options": [
					[
						"order",
						"ORD"
					],
					[
						"character",
						"CHR"
					]
				]
			},
			{
				"type": "input_value",
				"name": "VALUE"
			}
		],
		"output": null,
		"extensions": [
			"character_operations",
			"character_validator_helper"
		],
		"style": "text_blocks",
		"tooltip": "",
		"helpUrl": ""
	}
]);

// Yes, even this needs to be so unelegant
type CharacterOperationsBlock = Blockly.BlockSvg & ICharacterOperations;
interface ICharacterOperations extends CharacterOperationsType {};
type CharacterOperationsType = typeof CharacterOperations;

const CharacterOperations = {
	validator_: function(this: Blockly.Input, name: string) {
		const block = this.getSourceBlock();
		if (name === "ORD") {
			// If input doesn't exist, there's nothing to do
			block.getInput("VALUE")?.setCheck("String");
			block.setOutput(true, "Number");
		}
		else if (name === "CHR") {
			block.getInput("VALUE")?.setCheck("Number");
			block.setOutput(true, "String");
		}
		return name;
	}
};
Blockly.Extensions.registerMixin(
	"character_operations",
	CharacterOperations
);

function characterOperationsValidatorHelper(this: CharacterOperationsBlock) {
	this.getField("ACTION")?.setValidator(this.validator_);
}
Blockly.Extensions.register(
	"character_validator_helper",
	characterOperationsValidatorHelper
);

Blockly.common.defineBlocks(blocks);
