import { IDataConstructorModel } from "./interfaces/i_data_constructor_model";
import { ITypeModel, TypeKind } from "./interfaces/i_type_model";

export class TypeModel implements ITypeModel {
	name: string;
	kind: TypeKind;
	dataConstructors: IDataConstructorModel[];
	typePlaceholders: string[];
	listElementType?: ITypeModel;
	tupleElementTypes?: ITypeModel[];

	constructor(
		name: string,
		kind: TypeKind,
		dataConstructors: IDataConstructorModel[],
		typePlaceholders: string[],
		listElementType?: ITypeModel,
		tupleElementTypes?: ITypeModel[]
	) {
		this.name = name;
		this.kind = kind;
		this.dataConstructors = dataConstructors;
		this.typePlaceholders = typePlaceholders;
		this.listElementType = listElementType;
		this.tupleElementTypes = tupleElementTypes;
	}

	addDataConstructor(dataConstructor: IDataConstructorModel): void {
		this.dataConstructors.push(dataConstructor);
	}

	removeDataConstructor(dataConstructor: IDataConstructorModel): void {
		const index = this.dataConstructors.indexOf(dataConstructor);
		if (index !== -1) {
			this.dataConstructors.splice(index, 1);
		}
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
