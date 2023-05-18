import * as Blockly from "blockly";
import { DataConstructorModel } from "./type_models/observabledataconstructormodel"
import { TypeModel } from "./type_models/observabletypemodel"
import { IDataConstructorModel } from "./type_models/interfaces/i_data_constructor_model"
import { ITypeModel, TypeKind } from "./type_models/interfaces/i_type_model"
import { ITypeMap } from "./type_models/interfaces/i_type_map"

// Type declarations for related blocks & types
type TypeWorkspaceExtensions = {
	typeMap: ITypeMap
	getTypeMap: () => { [typeName: string]: ITypeModel }
	setTypeMap: (typename: string, value: ITypeModel) => void
	getDataConsMap: () => { [dcName: string]: IDataConstructorModel }
	setDataConsMap: (typename: string, value: IDataConstructorModel) => void
}
type TypeWorkspace = Blockly.WorkspaceSvg & TypeWorkspaceExtensions

type TypeBlock = Blockly.BlockSvg & {
	isolate: () => void,
	typeName_: string,
	updateShape_: () => void
}

type DataConstructorBlock = Blockly.BlockSvg & {
	isolate: () => void,
	updateShape_: () => void,
	renameDataConstructor: () => void
}

type DataConstructorGetBlock = Blockly.BlockSvg & {
	isolate: () => void,
	dcName_: string,
	updateShape_: () => void
}

// Let's start, shall we?

function typeFlyoutBlocks(
	workspace: TypeWorkspace): Blockly.utils.toolbox.FlyoutDefinition {
	let jsonList: any[] = [
		{
			"kind": "block",
			"type": "types_primitive"
		},
		{
			"kind": "block",
			"type": "types_primitive",
			"fields": {
				"TYPE": "Double"
			}
		},
		{
			"kind": "block",
			"type": "types_primitive",
			"fields": {
				"TYPE": "Bool"
			}
		},
		{
			"kind": "block",
			"type": "types_list"
		},
		{
			"kind": "block",
			"type": "types_list",
			"inputs": {
				"SUBTYPE": {
					"block": {
						"kind": "block",
						"type": "types_primitive",
						"fields": {
							"TYPE": "Char"
						}
					}
				}
			}
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
			"type": "types_cast"
		},
		{
			"kind": "block",
			"type": "types_placeholder"
		}
	]
	if (workspace.typeMap && Object.keys(workspace.getTypeMap()).length !== 0) {
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
		for (const dataConsModel in dataConsMap) {
			jsonList.push(
				{
					"kind": "block",
					"type": "types_dc_get",
					"extraState": {
						"dcName": dataConsMap[dataConsModel].name
					}
				}
			)
		}
	}
	return jsonList
}

function updateDynamicCategory(
	workspace: TypeWorkspace): Blockly.utils.toolbox.FlyoutDefinition {
	let toolbox  = []
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

function addTypeCallback(bflyout: Blockly.FlyoutButton): void {
	const workspace = bflyout.getTargetWorkspace() as TypeWorkspace
	let typeName

	while (true) {
		typeName = prompt("New type name:")

		if (!typeName) {
			return // User probably clicked on it by accident
		}
		if (workspace.getTypeMap()[typeName]) {
			alert("A type named '" + typeName + "' already exists.")
		}
		else if (workspace.getDataConsMap()[typeName]) {
			alert("A data constructor named '" + typeName + "' already exists.")
		}
		else break
	}

	// Add the type to the workspace's type map
	workspace.setTypeMap(typeName,new TypeModel(
		typeName,
		4,
		[]
	))

	// Update the dynamic category to include the new type
	workspace.getToolbox().refreshSelection()
}

function generateModelParams(block: Blockly.Block | null): ITypeModel {
	if (!block || block.getStyleName() == "auto_#000000") {
		// I couldn't think less about this: who would use such a style name?
		// The link is missing, assume a unit type.
		return new TypeModel(
			"",
			TypeKind.Tuple,
			[],
			undefined,
			[]
		)
	}
	else if (block.type == "types_primitive") {
		// This is the first type of types of types
		return new TypeModel(
			block.getFieldValue("TYPE"),
			TypeKind.Primitive,
			[],
		)
	}
	else if (block.type == "types_list") {
		// The second of the type types
		let inner_typemod = generateModelParams(block.getInputTargetBlock("SUBTYPE"))
		return new TypeModel(
			"List",
			TypeKind.List,
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
			TypeKind.Tuple,
			templates,
			undefined,
			inner_typemods
		)
	}
	else if (block.type == "types_placeholder") {
		return new TypeModel(
			block.getFieldValue("NAME"),
			TypeKind.Placeholder,
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
			TypeKind.UserDefined,
			templates,
			undefined,
			inner_typemods
		)
	}
	else {
		return new TypeModel(
			"",
			TypeKind.Tuple,
			[],
			undefined,
			[]
		)
	}
}

export function identifyModelParams(model: ITypeModel | null) : (string | string[] | null) {
	switch (model.kind) {
		case TypeKind.Placeholder:
			return null
		case TypeKind.Primitive:
			switch (model.name) {
				case "Int":
				case "Integer":
				case "Float":
				case "Double":
					return "Number"
				case "Char":
					// I could make a block for a single character, but that would be
					// less than intuitive.
					return "String"
				case "Bool":
					return "Boolean"
			}
		case TypeKind.List:
			// Assuming strings are arrays of characters; this is not always the case.
			return ["Array", "String"]
		case TypeKind.Tuple:
			// Although there is no 1-tuple in Haskell and the fact that this library
			// is primarily designed with Haskell in mind, support for other languages
			// such as Python also exists, plus allowing users to define these is
			// intuitive in some sense.
			return "Tuple"
	}
}

function updateTypeModels(block: Blockly.Block): void {
	// Handles the modified workspace with extra functions for datatypes.
	const workspace = block.workspace as TypeWorkspace
	const typemodel = workspace.getTypeMap()[block.getFieldValue("TYPE")]
	const dcname = block.getFieldValue("NAME")
	const ret = new DataConstructorModel(
		dcname,
		typemodel,
		[]
	)
	let argtypes = ret.argTypes, placeholders = {}, cdc : TypeModel
	let i = 0
	while (block.getInput("DATA" + i)) {
		cdc = generateModelParams(block.getInputTargetBlock("DATA" + i))
		cdc.typePlaceholders.forEach((tph) => {
			placeholders[tph] = "Yes"
		})
		argtypes.push(cdc)
		i++
	}
	typemodel.typePlaceholders = Object.keys(placeholders)
	workspace.setDataConsMap(dcname, ret)

	// Now update the associated blocks
	// This is basically satirically clean code
	let dataConstructorBuildList =
		workspace.getBlocksByType("types_dc_get", false) as DataConstructorBlock[]
	for (const dataConstructorBuildBlock of dataConstructorBuildList) {
		dataConstructorBuildBlock.updateShape_()
	}

	let typeBuildList = workspace.getBlocksByType("types_type", false) as TypeBlock[]
	for (const typeBuildBlock of typeBuildList) {
		typeBuildBlock.updateShape_()
	}
}

function updateDataConsNames(workspace: TypeWorkspace, oldName: string, newName: string)
: void {
	let dataConstructorBuildList: any = workspace.getBlocksByType("types_dc_get", false)
	for (const dataConstructorBuildBlock of dataConstructorBuildList) {
		if (dataConstructorBuildBlock.dcName_ === oldName) {
			dataConstructorBuildBlock.dcName_ = newName
		}
	}
}

function removeDataCons(
	workspace: TypeWorkspace, block: Blockly.serialization.blocks.State) : void {
	const name = block["fields"]["NAME"]
	let dataConstructorBuildList =
		workspace.getBlocksByType("types_dc_get", false) as DataConstructorGetBlock[]
	for (const dataConstructorBuildBlock of dataConstructorBuildList) {
		if (dataConstructorBuildBlock.dcName_ === name) {
			dataConstructorBuildBlock.isolate()
			dataConstructorBuildBlock.dispose()
		}
	}
	delete workspace.getDataConsMap()[name]
}

export function removeType(workspace: TypeWorkspace, typeName: string): void {
	// Step 1: dissociate all type blocks of the chosen type
	let typeBuildList = workspace.getBlocksByType("types_type", false) as TypeBlock[]
	for (const typeBuildBlock of typeBuildList) {
		if (typeBuildBlock.typeName_ === typeName) {
			typeBuildBlock.isolate()
			typeBuildBlock.dispose()
		}
	}
	
	// Step 2: dissociate all data constructor defintions of the chosen type
	// Step 3: dissociate all data constructor blocks of the chosen type
	let dataConstructorBuildList =
		workspace.getBlocksByType("types_dc_def", false) as TypeBlock[]
	for (const dataConstructorBuildBlock of dataConstructorBuildList) {
		if (dataConstructorBuildBlock.getFieldValue("TYPE") === typeName) {
			dataConstructorBuildBlock.isolate()
			dataConstructorBuildBlock.dispose()
		}
	}

	// Step 4: remove the entries within the model
	delete workspace.getTypeMap()[typeName]
}

export function typeFlyout(
	workspace: TypeWorkspace): Blockly.utils.toolbox.FlyoutDefinition {
	workspace.registerButtonCallback(
		"DATATYPE",
		addTypeCallback
	)

	return updateDynamicCategory(workspace)
}

export function updateModels(workspace: TypeWorkspace): ((event: any) => void) {
	return function(event){
		// Comparing strings is never straightforward, but at least it's legible.
		if (event.type === Blockly.Events.BLOCK_MOVE) {
			let parentBlockId = event.newParentId
			if (!parentBlockId) parentBlockId = event.oldParentId
			if (!parentBlockId) return // FOLD!
			const block=workspace.getBlockById(parentBlockId)
			if (!block) return
			const rootBlock = block.getRootBlock()
			if (rootBlock.type != "types_dc_def") return
			updateTypeModels(rootBlock)
		}
		else if (event.type === Blockly.Events.BLOCK_CHANGE) {
			if (!event.blockId) return
			const block=workspace.getBlockById(event.blockId)
			if (!block) return
			switch (block.type) {
				case "types_dc_def":
					if (event.name === "NAME") {
						// You are dealing with a data constructor name change
						delete workspace.getDataConsMap()[event.oldValue]
						updateDataConsNames(workspace, event.oldValue, event.newValue)
					}
					updateTypeModels(block)
					break
				case "types_placeholder": // Placeholder changed, generate a new one.
				case "types_primitive": // Typechecks modified.
					let rootBlock = block.getRootBlock()
					if (rootBlock.type != "types_dc_def") break
					updateTypeModels(rootBlock)
				default:
					break
			}
		}
		else if (event.type === Blockly.Events.BLOCK_CREATE) {
			event.ids && event.ids.forEach(s => {
				const block = workspace.getBlockById(s)
				if (block.type == "types_dc_def") updateTypeModels(block)
			})
		}
		else if (event.type === Blockly.Events.BLOCK_DELETE) {
			let blockJson = event.oldJson
			if (blockJson["type"] == "types_dc_def") removeDataCons(workspace, blockJson)
		}
	}
}

export function nameIsUsed(name: string, workspace: TypeWorkspace, opt_exclude?: Blockly.Block) : boolean {
	let dataConstructorBuildList = workspace.getBlocksByType("types_dc_def", false)
	for (const dataConstructorBuildBlock of dataConstructorBuildList) {
		if (dataConstructorBuildBlock.getFieldValue("NAME") === name &&
			dataConstructorBuildBlock != opt_exclude) {
			return true
		}
	}

	// Checking blocks may be enough, but we need to be sure.
	let dataConstructorMap = workspace.getDataConsMap()
	let excludeModel = opt_exclude &&
		dataConstructorMap[opt_exclude.getFieldValue("NAME")]
	for (const model in dataConstructorMap) {
		if (dataConstructorMap[model] === excludeModel) continue
		if (dataConstructorMap[model].name === name) return true
	}

	// We also don't want data constructor names to collide with type names.
	for (const typeName in workspace.getTypeMap()) {
		if (typeName === name) return true
	}

	// Then and only then return false.
	return false
}

function nameIsLegal(name: string, workspace: TypeWorkspace, opt_exclude?: Blockly.Block): boolean {
	return !nameIsUsed(name, workspace, opt_exclude)
}

export function findLegalName(name: string, block: Blockly.Block): string {
	if (block.isInFlyout) {
		// Flyouts can have multiple data constructors called "Something".
		return name
	}
	name = name || "Something"
	while (!nameIsLegal(name, (block.workspace as TypeWorkspace), block)) {
		// Collision with another data constructor.
		const r = name.match(/^(.*?)(\d+)$/)
		if (!r) {
			name += "2"
		} else {
			name = r[1] + (parseInt(r[2]) + 1)
		}
	}
	return name
}

export function rename(this: Blockly.Field, name: string): string {
	const block = this.getSourceBlock() as DataConstructorBlock

	// Strip leading and trailing whitespace.  Beyond this, all names are legal.
	// Later in the code I'd have to enforce the first letter being capitalized.
	name = name.trim()

	const legalName = findLegalName(name, block)
	const oldName = this.getValue()
	if (oldName !== name && oldName !== legalName) {
		block.renameDataConstructor()
	}
	return legalName
}
