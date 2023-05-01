import { IDataConstructorModel } from "./interfaces/i_data_constructor_model"
import { ITypeModel, TypeKind } from "./interfaces/i_type_model"
import { utils } from "blockly"

export class TypeModel implements ITypeModel {
	id: string;
	name: string;
	kind: TypeKind;
	typePlaceholders: string[];
	listElementType?: ITypeModel;
	tupleElementTypes?: ITypeModel[];

	constructor(
		name: string,
		kind: TypeKind,
		typePlaceholders: string[],
		listElementType?: ITypeModel,
		tupleElementTypes?: ITypeModel[]
	) {
		this.id = utils.idGenerator.genUid()
		this.name = name
		this.kind = kind
		this.typePlaceholders = typePlaceholders
		this.listElementType = listElementType
		this.tupleElementTypes = tupleElementTypes
	}

	addTypePlaceholder(typePlaceholder: string): void {
		this.typePlaceholders.push(typePlaceholder);
	}

	removeTypePlaceholder(typePlaceholder: string): void {
		const index = this.typePlaceholders.indexOf(typePlaceholder);
		if (index !== -1) {
			this.typePlaceholders.splice(index, 1);
		}
	}
}
