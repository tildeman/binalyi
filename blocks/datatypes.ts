import * as Blockly from "blockly";
import { removeType, identifyModelParams, findLegalName, rename, TypeWorkspace } from "../categories/types.js";
import { ContextMenuOption, LegacyContextMenuOption, Scope } from "blockly/core/contextmenu_registry.js";

const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
	{
		"type": "types_cast",
		"message0": "cast %1 to %2",
		"args0": [
			{
				"type": "input_value",
				"name": "VALUE"
			},
			{
				"type": "input_value",
				"name": "TYPE",
				"check": "Type"
			}
		],
		"output": null,
		"style": "loop_blocks",
		"tooltip": "Cast a value into a type.",
		"inputsInline": true,
		"helpUrl": ""
	},
	{
		"type": "types_list",
		"message0": "List of %1",
		"args0": [
			{
				"type": "input_value",
				"name": "SUBTYPE",
				"check": "Type"
			}
		],
		"output": "Type",
		"style": "loop_blocks",
		"tooltip": "The list of whatever type.",
		"helpUrl": ""
	},
	{
		"type": "types_tuple",
		"output": "Type",
		"style": "loop_blocks",
		"tooltip": "A product type of different things.",
		"mutator": "tuple_type_mutator",
		"extensions": [
			"types_post_initialization"
		],
		"helpUrl": ""
	},
	{
		"type": "types_maybe",
		"message0": "Maybe %1",
		"args0": [
			{
				"type": "input_value",
				"name": "TYPE",
				"check": "Type"
			}
		],
		"output": "Type",
		"style": "loop_blocks",
		"tooltip": "The anonymous error type.",
		"helpUrl": ""
	},
	{
		"type": "types_primitive",
		"message0": "%1",
		"args0": [
			{
				"type": "field_dropdown",
				"name": "TYPE",
				"options": [
					[
						"Big integer",
						"Integer"
					],
					[
						"Integer",
						"Int"
					],
					[
						"Big decimal",
						"Double"
					],
					[
						"Decimal",
						"Float"
					],
					[
						"Character",
						"Char"
					],
					[
						"Truth",
						"Bool"
					]
				]
			}
		],
		"output": "Type",
		"style": "loop_blocks",
		"extensions": [
			"types_tooltip"
		],
		"helpUrl": ""
	},
	{
		"type": "types_mutator_container",
		"message0": "types %1 %2",
		"args0": [
			{
				"type": "input_dummy"
			},
			{
				"type": "input_statement",
				"name": "STACK"
			}
		],
		"style": "loop_blocks",
		"tooltip": "Add, remove, or reorder sections to reconfigure this type block.",
		"helpUrl": ""
	},
	{
		"type": "types_mutator_item",
		"message0": "type",
		"previousStatement": null,
		"nextStatement": null,
		"style": "loop_blocks",
		"tooltip": "Add a type to the product",
		"helpUrl": ""
	},
	{
		"type": "types_placeholder",
		"message0": "%1",
		"args0": [
			{
				"type": "field_input",
				"name": "NAME",
				"text": "a"
			}
		],
		"output": "Type",
		"style": "loop_blocks",
		"tooltip": "A type placeholder to be used in templates.",
		"helpUrl": ""
	},
	{
		"type": "types_dc_def",
		"message0": "data %1 of %2",
		"args0": [
			{
				"type": "field_input",
				"name": "NAME",
				"text": "Something"
			},
			{
				"type": "input_dummy",
				"name": "META"
			}
		],
		"extensions": [
			"data_constructor_initialization",
			"dc_context_menu_mixin",
			"disconnect_blocks_mixin",
			"dc_rename_mixin"
		],
		"mutator": "data_cons_mutator",
		"style": "loop_blocks",
		"tooltip": "",
		"helpUrl": ""
	},
	{
		"type": "types_type",
		"output": "Type",
		"style": "loop_blocks",
		"extensions": [
			"disconnect_blocks_mixin",
			"type_menu_mixin"
		],
		"mutator": "type_mutator",
		"tooltip": "",
		"helpUrl": ""
	},
	{
		"type": "types_dc_get",
		"output": "Type",
		"style": "loop_blocks",
		"extensions": [
			"disconnect_blocks_mixin"
		],
		"mutator": "data_cons_get_mutator",
		"tooltip": "",
		"helpUrl": ""
	},
]);

const TOOLTIPS_BY_TYPE = {
	"Integer": "An integer without constraints.",
	"Int": "An integer from approximately -10^18 to 10^18.",
	"Float": "A rough representation of decimals from -3*10^38 to 3*10^38.",
	"Double": "A finer representation of decimals from -2*10^308 to 2*10^308.",
	"Char": "A Unicode character.",
	"Bool": "A truth value representing true or false."
};
Blockly.Extensions.register(
	"types_tooltip",
	Blockly.Extensions.buildTooltipForDropdown("TYPE", TOOLTIPS_BY_TYPE)
);

type ProductTypeBlock = Blockly.Block & IProductTypeMutator;
interface IProductTypeMutator extends ProductTypeMutatorType {}
type ProductTypeMutatorType = typeof ProductTypeMutator;

type BlockWithValueConnection = Blockly.BlockSvg & {
	valueConnection_: Blockly.Connection | null;
};

const ProductTypeMutator = {
	itemCount_: 2,

	saveExtraState: function(this: ProductTypeBlock) {
		return {
			"itemCount": this.itemCount_
		};
	},

	loadExtraState: function(this: ProductTypeBlock, state: any) {
		this.itemCount_ = state["itemCount"];
		this.updateShape_()
	},

	decompose: function(this: ProductTypeBlock, workspace: Blockly.WorkspaceSvg) {
		const containerBlock = workspace.newBlock("types_mutator_container");
		containerBlock.initSvg();
		const stackInput = containerBlock.getInput("STACK");
		if (!stackInput) return;
		let connection = stackInput.connection;
		for (let i = 0; i < this.itemCount_; ++i) {
			const itemBlock = workspace.newBlock("types_mutator_item");
			itemBlock.initSvg();
			connection?.connect(itemBlock.previousConnection);
			connection = itemBlock.nextConnection;
		}
		return containerBlock;
	},

	compose: function(this: ProductTypeBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK");
		if (!itemBlock) return;
		const connections: (Blockly.Connection | null)[] = [];
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			connections.push(
				(itemBlock as BlockWithValueConnection | null)?.valueConnection_ || null);
			itemBlock = itemBlock.getNextBlock();
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			const connection = this.getInput("ADD" + i)?.connection?.targetConnection || null;
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect();
			}
		}
		this.itemCount_ = connections.length;
		this.updateShape_()

		for (let i = 0; i < this.itemCount_; ++i) {
			connections[i]?.reconnect(this, "ADD" + i);
		}
	},

	saveConnections: function(this: ProductTypeBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK") as BlockWithValueConnection | null;
		let i = 0;
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock() as BlockWithValueConnection | null;
				continue;
			}
			const input = this.getInput("ADD" + i);
			itemBlock.valueConnection_ = (input && input.connection?.targetConnection) || null;
			itemBlock = itemBlock.getNextBlock() as BlockWithValueConnection | null;
			i++;
		}
	},

	updateShape_: function(this: ProductTypeBlock) {
		if (this.itemCount_ && this.getInput("EMPTY")) {
			this.removeInput("EMPTY");
			this.setTooltip("A product type of different things.");
		}
		else if (!this.itemCount_ && !this.getInput("EMPTY")) {
			this.appendDummyInput("EMPTY").appendField("Unit");
			this.setTooltip("The unit type (aka null, nil, none, etc.).");
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			if (!this.getInput("ADD" + i)) {
				const input = this.appendValueInput("ADD" + i)
								  .setAlign(Blockly.inputs.Align.RIGHT)
								  .setCheck("Type");
				if (i === 0) {
					input.appendField("Tuple of");
				}
			}
		}

		for (let i = this.itemCount_; this.getInput("ADD" + i); ++i) {
			this.removeInput("ADD" + i);
		}
	}
};
Blockly.Extensions.registerMutator(
	"tuple_type_mutator",
	ProductTypeMutator,
	undefined,
	["types_mutator_item"]
);

function updateShapeLikeATrueList(this: Blockly.Block) {
	if ("updateShape_" in this) (this.updateShape_ as () => void)();
}
Blockly.Extensions.register(
	"types_post_initialization",
	updateShapeLikeATrueList
);

function dataConstructorUpdateShape(this: DataConstructorBlock) {
	const input = this.getInput("META");
	if (!input) return;
	input.appendField(new Blockly.FieldDropdown(retrieveTypeList(this.workspace as TypeWorkspace)), "TYPE");
	const nameField = this.getField("NAME");
	if (nameField) nameField.setValidator(rename);
	this.updateShape_()
}
Blockly.Extensions.register(
	"data_constructor_initialization",
	dataConstructorUpdateShape
);

// Blockly developers call this a factory, so you can call this retrieveTypeListFactory
function retrieveTypeList(workspace: TypeWorkspace): Blockly.MenuGenerator {
	return function() {
		if (workspace.getTypeMap) {
			return Object.keys(workspace.getTypeMap()).map((v) => {return [v, v]});
		}
		return [["Undefined", "Undefined"]];
	}
}

// I want to call this a curried function, but this sounds like alien talk.
function deleteOptionCallback(block: DataConstructorBlock) {
	return function() {
		const workspace = block.workspace;
		const typeName = block.getFieldValue("TYPE");
		removeType(workspace as TypeWorkspace, typeName);
	}
}

function tmpFindNameFactory(block: Blockly.Block) {
	return function() {
		let s = prompt("What do you want to call this block?");
		if (s) alert("The closest available name: " + findLegalName(s, block));
	}
}

type DataConstructorBlock = Blockly.Block & IDataConstructorMutator;
interface IDataConstructorMutator extends DataConstructorMutatorType {}
type DataConstructorMutatorType = typeof DataConstructorMutator;

const dataConstructorContextMenuMixin = {
	customContextMenu: function(this: DataConstructorBlock, options: Array<ContextMenuOption | LegacyContextMenuOption>) {
		options.push({
			text: "Delete Type",
			enabled: true,
			callback: deleteOptionCallback(this)
		});
		options.push({
			text: "Find a Legal Name",
			enabled: true,
			callback: tmpFindNameFactory(this)
		});
	}
};
Blockly.Extensions.registerMixin(
	"dc_context_menu_mixin",
	dataConstructorContextMenuMixin
);

const dataConstructorRenameMixin = {
	renameDataConstructor: function(this: DataConstructorBlock, oldName: string, newName: string) {
		if (oldName === this.getFieldValue("NAME")) {
			this.setFieldValue(newName, "NAME");
		}
	}
};
Blockly.Extensions.registerMixin(
	"dc_rename_mixin",
	dataConstructorRenameMixin
);
const DataConstructorMutator = {
	itemCount_: 2,

	saveExtraState: function(this: DataConstructorBlock) {
		return {
			"itemCount": this.itemCount_
		};
	},

	loadExtraState: function(this: DataConstructorBlock, state: any) {
		this.itemCount_ = state["itemCount"];
		this.updateShape_()
	},

	decompose: function(this: DataConstructorBlock, workspace: TypeWorkspace) {
		const containerBlock = workspace.newBlock("types_mutator_container");
		containerBlock.initSvg();
		const stackInput = containerBlock.getInput("STACK");
		if (!stackInput) return containerBlock;
		let connection = stackInput.connection;
		for (let i = 0; i < this.itemCount_; ++i) {
			const itemBlock = workspace.newBlock("types_mutator_item");
			itemBlock.initSvg();
			connection?.connect(itemBlock.previousConnection);
			connection = itemBlock.nextConnection;
		}
		return containerBlock;
	},

	compose: function(this: DataConstructorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK");
		const connections: (Blockly.Connection | null)[] = [];
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			connections.push(
				(itemBlock as BlockWithValueConnection | null)?.valueConnection_ || null);
			itemBlock = itemBlock.getNextBlock();
		}

		for (let i = 0; i < this.itemCount_; ++i) {
			const connection = this.getInput("DATA" + i)?.connection?.targetConnection;
			if (connection && connections.indexOf(connection) === -1) {
				connection.disconnect();
			}
		}
		this.itemCount_ = connections.length;
		this.updateShape_()

		for (let i = 0; i < this.itemCount_; ++i) {
			connections[i]?.reconnect(this, "DATA" + i);
		}
	},

	saveConnections: function(this: DataConstructorBlock, containerBlock: Blockly.Block) {
		let itemBlock = containerBlock.getInputTargetBlock("STACK") as BlockWithValueConnection | null;
		let i = 0;
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock() as BlockWithValueConnection | null;
				continue;
			}
			const input = this.getInput("DATA" + i);
			itemBlock.valueConnection_ = input && input.connection?.targetConnection || null;
			itemBlock = itemBlock.getNextBlock() as BlockWithValueConnection | null;
			i++;
		}
	},

	updateShape_: function(this: DataConstructorBlock) {
		for (let i = 0; i < this.itemCount_; ++i) {
			if (!this.getInput("DATA" + i)) {
				const input = this.appendValueInput("DATA" + i)
					  .setAlign(Blockly.inputs.Align.RIGHT)
					  .setCheck("Type");
				if (i === 0) {
					input.appendField("with");
				}
			}
		}

		for (let i = this.itemCount_; this.getInput("DATA" + i); ++i) {
			this.removeInput("DATA" + i);
		}
	}
};
Blockly.Extensions.registerMutator(
	"data_cons_mutator",
	DataConstructorMutator,
	undefined,
	["types_mutator_item"]
);

type TypeBlock = Blockly.Block & ITypeMutator;
interface ITypeMutator extends TypeMutatorType {}
type TypeMutatorType = typeof TypeDefMutator;

function deleteRenameOptionCallback(block: TypeBlock) {
	return function() {
		const workspace = block.workspace;
		const typeName = ("typeName_" in block && typeof block.typeName_ == "string") ? block.typeName_ : "";
		removeType(workspace as TypeWorkspace, typeName);
	}
}

const typeContextMenuMixin = {
	customContextMenu: function(this: TypeBlock, options: Array<ContextMenuOption | LegacyContextMenuOption>) {
		options.push({
			text: "Delete Type",
			enabled: true,
			callback: deleteRenameOptionCallback(this)
		});
	}
};
Blockly.Extensions.registerMixin(
	"type_menu_mixin",
	typeContextMenuMixin
);

const TypeDefMutator = {
	typeName_: "",

	saveExtraState: function(this: TypeBlock) {
		return {
			"typeName": this.typeName_
		}
	},

	loadExtraState: function(this: TypeBlock, state: any) {
		this.typeName_ = state["typeName"];
		this.updateShape_();
	},

	updateShape_: function(this: TypeBlock) {
		let typeModel = (this.workspace as TypeWorkspace).getTypeMap()[this.typeName_];
		let typePlaceholders = typeModel["typePlaceholders"];
		if (typePlaceholders.length && this.getInput("EMPTY")) {
			this.removeInput("EMPTY");
		}
		else if (!typePlaceholders.length && !this.getInput("EMPTY")) {
			this.appendDummyInput("EMPTY")
				.appendField("type " + this.typeName_);
		}

		for (let i = 0; i < typePlaceholders.length; ++i) {
			if (!this.getInput("DATA" + i)) {
				const input = this.appendValueInput("DATA" + i)
					  .setAlign(Blockly.inputs.Align.RIGHT)
					  .setCheck("Type");
				if (i === 0) {
					input.appendField("type " + this.typeName_ + " with:");
				}
				input.appendField(typePlaceholders[i], "NAME" + i);
			}
			else {
				this.setFieldValue(typePlaceholders[i], "NAME" + i);
			}
		}

		for (let i = typePlaceholders.length; this.getInput("DATA" + i); ++i) {
			this.removeInput("DATA" + i);
		}
	}
};
Blockly.Extensions.registerMutator(
	"type_mutator",
	TypeDefMutator,
	undefined,
	[]
);

type DataConstructorGetBlock = Blockly.Block & IDataConstructorGetMutator;
interface IDataConstructorGetMutator extends DataConstructorGetMutatorType {}
type DataConstructorGetMutatorType = typeof DataConstructorGetMutator;

const DataConstructorGetMutator = {
	dcName_: "",

	saveExtraState: function(this: DataConstructorGetBlock) {
		return {
			"dcName": this.dcName_
		}
	},

	loadExtraState: function(this: DataConstructorGetBlock, state: any) {
		this.dcName_ = state["dcName"];
		this.updateShape_();
	},

	updateShape_: function(this: DataConstructorGetBlock) {
		let dataConsModel = (this.workspace as TypeWorkspace).getDataConsMap()[this.dcName_];
		let argumentTypes = dataConsModel?.argTypes || [];
		if (argumentTypes.length && this.getInput("EMPTY")) {
			this.removeInput("EMPTY");
		}
		else if (!argumentTypes.length) {
			if (!this.getInput("EMPTY")) {
				this.appendDummyInput("EMPTY")
					.appendField(this.dcName_, "NAME");
			}
			else {
				this.setFieldValue(this.dcName_, "NAME");
			}
		}

		for (let i = 0; i < argumentTypes.length; ++i) {
			let input = this.getInput("DATA" + i);
			if (!input) {
				input = this.appendValueInput("DATA" + i)
					  .setAlign(Blockly.inputs.Align.RIGHT);
				if (i === 0) {
					input.appendField(this.dcName_, "NAME");
				}
			}
			else {
				this.setFieldValue(this.dcName_, "NAME");
			}
			input.setCheck(identifyModelParams(argumentTypes[i]));
		}

		for (let i = argumentTypes.length; this.getInput("DATA" + i); ++i) {
			this.removeInput("DATA" + i);
		}
	}
}
Blockly.Extensions.registerMutator(
	"data_cons_get_mutator",
	DataConstructorGetMutator,
	undefined,
	[]
);

const disconnectBlocksMixin = {
	isolate: function(this: Blockly.Block) {
		for (let i = 0; this.getInput("DATA" + i); ++i) {
			if (this.getInput("DATA" + i)?.connection?.targetConnection) {
				this.getInput("DATA" + i)?.connection?.disconnect();
			}
		}
	}
};
Blockly.Extensions.registerMixin(
	"disconnect_blocks_mixin",
	disconnectBlocksMixin
);

Blockly.common.defineBlocks(blocks);
