import { ITypeModel } from "./i_type_model";

export interface IDataConstructorModel {
	id: string
	name: string
	parentType: ITypeModel
	argTypes: ITypeModel[]
}
