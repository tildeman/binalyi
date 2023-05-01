import { IDataConstructorModel } from "./interfaces/i_data_constructor_model"
import { ITypeModel } from "./interfaces/i_type_model"
import { utils } from "blockly"

export class DataConstructorModel implements IDataConstructorModel {
	id: string;
	name: string;
	parentType: ITypeModel;
	argTypes: ITypeModel[];

	constructor(name: string, parentType: ITypeModel, argTypes: ITypeModel[]) {
		this.id = utils.idGenerator.genUid()
		this.name = name;
		this.parentType = parentType;
		this.argTypes = argTypes;
	}
}
