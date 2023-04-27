import { ITypeModel } from "./i_type_model";
import { IDataConstructorModel } from "./i_data_constructor_model";

export interface ITypeMap {
  types: { [typeName: string]: ITypeModel };
  dataConstructors: { [dcName: string]: IDataConstructorModel };
}
