import { IDataConstructorModel } from "./interfaces/i_data_constructor_model";
import { ITypeModel } from "./interfaces/i_type_model";

export class DataConstructorModel implements IDataConstructorModel {
  name: string;
  parentType: ITypeModel;
  argTypes: ITypeModel[];

  constructor(name: string, parentType: ITypeModel, argTypes: ITypeModel[]) {
    this.name = name;
    this.parentType = parentType;
    this.argTypes = argTypes;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  getParentType(): ITypeModel {
    return this.parentType;
  }

  setParentType(parentType: ITypeModel): void {
    this.parentType = parentType;
  }

  getArgTypes(): ITypeModel[] {
    return this.argTypes;
  }

  setArgTypes(argTypes: ITypeModel[]): void {
    this.argTypes = argTypes;
  }
}
