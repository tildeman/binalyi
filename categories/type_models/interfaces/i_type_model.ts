import { IDataConstructorModel } from "./i_data_constructor_model";

export enum TypeKind {
	Placeholder = 0,
	Primitive = 1,
	List = 2,
	Tuple = 3,
	UserDefined = 4,
}

export interface ITypeModel {
	readonly name: string
	readonly kind: TypeKind
	readonly dataConstructors: IDataConstructorModel[]
	readonly typePlaceholders: string[]

	addDataConstructor(dataConstructor: IDataConstructorModel): void
	removeDataConstructor(dataConstructor: IDataConstructorModel): void
	addTypePlaceholder(typePlaceholder: string): void
	removeTypePlaceholder(typePlaceholder: string): void

	// list-specific properties
	readonly listElementType?: ITypeModel

	// tuple-specific properties
	readonly tupleElementTypes?: ITypeModel[]
}
