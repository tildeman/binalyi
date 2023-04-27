import * as Blockly from "blockly";
import { DataConstructorModel } from "./type_models/observabledataconstructormodel";
import { TypeModel } from "./type_models/observabletypemodel";

var callback_idempotence = false

function typeFlyoutBlocks(workspace) {
	const jsonList: any[] = [
		{
			"kind": "block",
			"type": "types_primitive"
		},
		{
			"kind": "block",
			"type": "types_list"
		},
		{
			"kind": "block",
			"type": "types_tuple"
		},
		{
			"kind": "block",
			"type": "types_tuple",
			"extraState": {
				"itemCount": 0
			}
		},
		{
			"kind": "block",
			"type": "types_placeholder"
		}
	]
	if (workspace.typeMap) {
		jsonList.push(
			{
				"kind": "label",
				"text": "Custom types"
			},
			{
				"kind": "sep",
				"gap": "4"
			}
		)
		const typeMap = workspace.getTypeMap()
		for (const typeModel in typeMap) {
			jsonList.push(
				{
					"kind": "block",
					"type": "types_type",
					"extraState": {
						"typeName": typeMap[typeModel].name
					}
				}
			)
		}

		jsonList.push(
			{
				"kind": "label",
				"text": "Data construction"
			},
			{
				"kind": "sep",
				"gap": "4"
			},
			{
				"kind": "block",
				"type": "types_dc_def"
			}
		)
		const dataConsMap = workspace.getDataConsMap()
		console.log(dataConsMap)
		for (const dataConsModel in dataConsMap) {
			jsonList.push(
				{
					"kind": "block",
					"type": "types_dc_get",
					"extraState": {
						"dcName": dataConsMap[dataConsModel].getName()
					}
				}
			)
		}
	}
	return jsonList
}

function updateDynamicCategory(workspace) {
	let toolbox = []
	const button = {
		"kind": "button",
		"text": "Create type...",
		"callbackKey": "DATATYPE"
	}
	toolbox.push(button)

	const blockList = typeFlyoutBlocks(workspace)
	toolbox = toolbox.concat(blockList)

	return toolbox
}

function addTypeCallback(bflyout) {
	const workspace = bflyout.workspace
	const targetwsp = bflyout.getTargetWorkspace()
	if (!callback_idempotence){
		targetwsp.typeMap = workspace.typeMap = {
			types: {},
			dataConstructors: {},
		}
		targetwsp.getTypeMap = workspace.getTypeMap = function(){
			return this.typeMap.types
		}
		targetwsp.setTypeMap = workspace.setTypeMap = function(typename, value){
			this.typeMap.types[typename] = value
		}
		targetwsp.getDataConsMap = workspace.getDataConsMap = function(){
			return this.typeMap.dataConstructors
		}
		targetwsp.setDataConsMap = workspace.setDataConsMap = function(typename, value){
			this.typeMap.dataConstructors[typename] = value
		}
	}
	callback_idempotence = true
	
	const typeName = prompt("New type name:");

	if (typeName) {
		// Add the type to the workspace's type map
		workspace.setTypeMap(typeName,new TypeModel(
			typeName,
			4,
			[],
			[]
		))

		// Update the dynamic category to include the new type
		return updateDynamicCategory(bflyout)
	}
	return []
}

function generateModelParams(block: Blockly.Block | null): TypeModel {
	if (!block) {
		// The link is missing, assume a unit type.
		return new TypeModel(
			"",
			3,
			[],
			[],
			undefined,
			[]
		)
	}
	else if (block.type == "types_primitive") {
		// This is the first type of types of types
		return new TypeModel(
			block.getFieldValue("TYPE"),
			1,
			[],
			[],
		)
	}
	else if (block.type == "types_list") {
		// The second of the type types
		let inner_typemod = generateModelParams(block.getInputTargetBlock("SUBTYPE"))
		return new TypeModel(
			"List",
			2,
			[],
			inner_typemod.typePlaceholders,
			inner_typemod,
		)
	}
	else if (block.type == "types_tuple") {
		let inner_typemods: TypeModel[] = [], i = 0
		let templates = []
		while (block.getInput("ADD" + i)) {
			inner_typemods.push(
				generateModelParams(block.getInputTargetBlock("ADD" + i))
			)
			templates = templates.concat(inner_typemods[i].typePlaceholders)
			i++
		}
		return new TypeModel(
			"Tuple",
			3,
			[],
			templates,
			undefined,
			inner_typemods
		)
	}
	else if (block.type == "types_placeholder") {
		return new TypeModel(
			block.getFieldValue("NAME"),
			0,
			[],
			[block.getFieldValue("NAME")]
		)
	}
	else if (block.type == "types_type") {
		let inner_typemods: TypeModel[] = [], i = 0
		let templates = []
		while (block.getInput("DATA" + i)) {
			inner_typemods.push(
				generateModelParams(block.getInputTargetBlock("DATA" + i))
			)
			templates = templates.concat(inner_typemods[i].typePlaceholders)
			i++
		}
		return new TypeModel(
			block["typeName_"],
			4,
			[],
			templates,
			undefined,
			inner_typemods
		)
	}
}

function updateTypeModels(block: Blockly.Block): void {
	// Handles the modified workspace with extra functions for datatypes.
	const workspace : any = block.workspace
	const typemodel = workspace.getTypeMap()[block.getFieldValue("TYPE")]
	const dcname = block.getFieldValue("NAME")
	const ret = new DataConstructorModel(
		dcname,
		typemodel,
		[]
	)
	let argtypes = ret.getArgTypes(), placeholders = {}, cdc : TypeModel
	let i = 0
	while (block.getInput("DATA" + i)) {
		cdc = generateModelParams(block.getInputTargetBlock("DATA" + i))
		cdc.typePlaceholders.forEach((tph) => {
			placeholders[tph] = "Yes"
		})
		argtypes.push(cdc)
		i++
	}
	for (i = 0; i < typemodel.dataConstructors.length; i++) {
		if (typemodel.dataConstructors[i].name == dcname) {
			typemodel.dataConstructors[i] = ret // Assign the new model
			// TODO: Send a signal for data constructor adapters
			break
		}
	}
	typemodel.typePlaceholders = Object.keys(placeholders)
	workspace.setDataConsMap(dcname, ret)
}

export function typeFlyout(workspace) {
	workspace.registerButtonCallback(
		"DATATYPE",
		addTypeCallback
	)

	return updateDynamicCategory(workspace)
}

export function updateModels(workspace) {
	return function(event){
		if (event.type == Blockly.Events.BLOCK_MOVE) {
			let parentBlockId = event.newParentId
			if (!parentBlockId) parentBlockId = event.oldParentId
			if (!parentBlockId) return // FOLD!
			let block=workspace.getBlockById(parentBlockId)
			if (!block) return
			let rootBlock = block.getRootBlock()
			if (rootBlock.type != "types_dc_def") return
			updateTypeModels(rootBlock)
		}
		else if (event.type == Blockly.Events.BLOCK_CHANGE) {
			if (!event.blockId) return
			let block=workspace.getBlockById(event.blockId)
			if (!block) return
			switch (block.type) {
				case "types_dc_def":
					if (event.name === "NAME") {
						// You are dealing with a name change
						delete workspace.getDataConsMap()[event.oldValue]
					}
					updateTypeModels(block)
					break;
				case "types_placeholder": // Placeholder changed, generate a new one.
					let rootBlock = block.getRootBlock()
					if (rootBlock.type != "types_dc_def") break;
					updateTypeModels(rootBlock)
				default:
					break;
			}
		}
	}
}
