export enum Primitives {
	HBool,
	HChar,
	HInt,
	HInteger
}

export interface TypePlaceholder {
	name: string
}

export interface ListOf {
	lot: Primitives | ListOf | TupleOf | ITypeModel
}

export interface IOOf {
	lot: Primitives | ListOf | TupleOf | ITypeModel
}

export interface TupleOf {
	tot: Array<Primitives | ListOf | TupleOf | ITypeModel>
}

export interface IDataConstructorModel {
	// Sets the human-readable name of the data constructor
	// I have figured out why we need the types, but I have to do homework right now
	setName(name: string): this
	// Returns the human-readable name of the data constructor.
	getName(): string
	
}
