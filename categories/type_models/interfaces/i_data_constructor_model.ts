import { ITypeModel } from "./i_type_model";

export interface IDataConstructorModel {
	name: string
	parentType: ITypeModel
	argTypes: ITypeModel[]

	getName(): string
	setName(name: string): void

	getParentType(): ITypeModel
	setParentType(parentType: ITypeModel): void

	getArgTypes(): ITypeModel[];
	setArgTypes(argTypes: ITypeModel[]): void
}
