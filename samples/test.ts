import { TypeWorkspace } from "../include/categories/types";
import * as FBlockly from "../include/index"

let toolbox = {
	"desc": "Reference toolbox to be used with this library",
	"kind": "categoryToolbox",
	"contents": [
		{
			"kind": "category",
			"name": "Monads",
			"colour": "0",
			"contents": [
				{
					"kind": "block",
					"type": "monad_return"
				},
				{
					"kind": "block",
					"type": "monad_fail"
				},
				{
					"kind": "block",
					"type": "monad_operations"
				},
				{
					"kind": "block",
					"type": "monad_bindings"
				},
				{
					"kind": "block",
					"type": "monad_action"
				}
			]
		},
		{
			"kind": "category",
			"name": "Colour",
			"categorystyle": "colour_category",
			"contents": [
				{
					"kind": "block",
					"type": "colour_picker"
				},
				{
					"kind": "block",
					"type": "colour_random"
				},
				{
					"kind": "block",
					"type": "colour_rgb"
				},
				{
					"kind": "block",
					"type": "colour_blend"
				}
			]
		},
		{
			"kind": "category",
			"name": "Tuples",
			"colour": "65",
			"contents": [
				{
					"kind": "block",
					"type": "tuples_create_empty"
				},
				{
					"kind": "block",
					"type": "tuples_create_with"
				},
				{
					"kind": "block",
					"type": "tuples_pair"
				}
			]
		},
		{
			"kind": "category",
			"name": "Types",
			"categorystyle": "loop_category",
			"custom": "DATATYPE"
		},
		{
			"kind": "category",
			"name": "Text",
			"categorystyle": "text_category",
			"contents": [
				{
					"kind": "block",
					"type": "text"
				},
				{
					"kind": "block",
					"type": "text_multiline"
				},
				{
					"kind": "block",
					"type": "text_join"
				},
				{
					"kind": "block",
					"type": "text_length"
				},
				{
					"kind": "block",
					"type": "text_charops"
				},
				{
					"kind": "block",
					"type": "text_isEmpty"
				},
				{
					"kind": "block",
					"type": "text_indexOf"
				},
				{
					"kind": "block",
					"type": "text_charAt"
				},
				{
					"kind": "block",
					"type": "text_getSubstring"
				},
				{
					"kind": "block",
					"type": "text_changeCase"
				},
				{
					"kind": "block",
					"type": "text_trim"
				},
				{
					"kind": "block",
					"type": "monad_print"
				},
				{
					"kind": "block",
					"type": "monad_putstr"
				},
				{
					"kind": "block",
					"type": "text_count"
				},
				{
					"kind": "block",
					"type": "text_replace"
				},
				{
					"kind": "block",
					"type": "text_reverse"
				},
				{
					"kind": "block",
					"type": "text_parse"
				},
				{
					"kind": "block",
					"type": "text_show"
				},
				{
					"kind": "block",
					"type": "monad_prompt"
				}
			]
		},
		{
			"kind": "category",
			"name": "Logic",
			"categorystyle": "logic_category",
			"contents": [
				{
					"kind": "block",
					"type": "logic_boolean"
				},
				{
					"kind": "block",
					"type": "logic_compare"
				},
				{
					"kind": "block",
					"type": "logic_operation"
				},
				{
					"kind": "block",
					"type": "logic_negate"
				},
				{
					"kind": "block",
					"type": "logic_null"
				},
				{
					"kind": "block",
					"type": "logic_wildcard"
				},
				{
					"kind": "block",
					"type": "logic_ternary"
				},
				{
					"kind": "block",
					"type": "logic_cond"
				},
				{
					"kind": "block",
					"type": "logic_patternmatch"
				}
			]
		},
		{
			"kind": "category",
			"name": "Math",
			"categorystyle": "math_category",
			"contents": [
				{
					"kind": "block",
					"type": "math_number"
				},
				{
					"kind": "block",
					"type": "math_arithmetic"
				},
				{
					"kind": "block",
					"type": "math_single"
				},
				{
					"kind": "block",
					"type": "math_trig"
				},
				{
					"kind": "block",
					"type": "math_constant"
				},
				{
					"kind": "block",
					"type": "math_number_property"
				},
				{
					"kind": "block",
					"type": "math_round"
				},
				{
					"kind": "block",
					"type": "math_on_list"
				},
				{
					"kind": "block",
					"type": "math_modulo"
				},
				{
					"kind": "block",
					"type": "math_constrain"
				},
				{
					"kind": "block",
					"type": "math_random_int"
				},
				{
					"kind": "block",
					"type": "math_random_float"
				},
				{
					"kind": "block",
					"type": "math_atan2"
				}
			]
		},
		{
			"kind": "category",
			"name": "Lists",
			"categorystyle": "list_category",
			"contents": [
				{
					"kind": "block",
					"type": "lists_create_empty"
				},
				{
					"kind": "block",
					"type": "lists_create_with"
				},
				{
					"kind": "block",
					"type": "lists_range"
				},
				{
					"kind": "block",
					"type": "lists_create_infinite"
				},
				{
					"kind": "block",
					"type": "lists_cons"
				},
				{
					"kind": "block",
					"type": "lists_repeat"
				},
				{
					"kind": "block",
					"type": "lists_reverse"
				},
				{
					"kind": "block",
					"type": "lists_join"
				},
				{
					"kind": "block",
					"type": "list_opad"
				},
				{
					"kind": "block",
					"type": "lists_isEmpty"
				},
				{
					"kind": "block",
					"type": "lists_length"
				},
				{
					"kind": "block",
					"type": "lists_map"
				},
				{
					"kind": "block",
					"type": "lists_filter"
				},
				{
					"kind": "block",
					"type": "lists_fold"
				},
				{
					"kind": "block",
					"type": "lists_indexOf"
				},
				{
					"kind": "block",
					"type": "lists_getSublist"
				},
				{
					"kind": "block",
					"type": "lists_sort"
				},
				{
					"kind": "block",
					"type": "lists_split"
				}
			]
		},
		{
			"kind": "category",
			"name": "Functions",
			"categorystyle": "procedure_category",
			"contents": [
				{
					"kind": "block",
					"type": "function_lambda"
				},
				{
					"kind": "block",
					"type": "function_compose"
				},
				{
					"kind": "block",
					"type": "function_apply"
				},
				{
					"kind": "block",
					"type": "function_let"
				},
				{
					"kind": "block",
					"type": "function_partialize"
				}
			]
		},
		{
			"kind": "category",
			"name": "Variables",
			"categorystyle": "variable_category",
			"custom": "VARIABLE_FUNCTIONAL"
		}
	]
};

let workspace = FBlockly.Blockly.inject("workspace", {toolbox: toolbox});

FBlockly.Init.initialize(workspace as TypeWorkspace);
