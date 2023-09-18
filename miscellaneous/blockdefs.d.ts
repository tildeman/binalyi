// Blockly's type definitions are a fiend
type FieldTypes = "field_label_serializable" | "field_input" | "field_number" |
	"field_angle" | "field_dropdown" | "field_checkbox" | "field_colour" |
	"field_variable" | "field_image";

type InputTypes = "input_value" | "input_statement" | "input_dummy";

/**
 * Abstract for all fields.
 */
interface IAbstractField {
	type: FieldTypes;
	name: string;
}

/**
 * Abstract for all inputs.
 */
interface IAbstractInput {
	type: InputTypes;
	name?: string;
	align?: "LEFT" | "CENTRE" | "RIGHT";
	check?: string | string[];
}

/**
 * Field for dynamic block labels.
 */
interface ISerializableLabel extends IAbstractField {
	type: "field_label_serializable";
	text: string;
}

/**
 * Field for text inputs.
 */
interface ITextInput extends IAbstractField {
	type: "field_input";
	text: string;
}

/**
 * Field for numeric inputs.
 */
interface INumberInput extends IAbstractField {
	type: "field_number";
	value: number,
	min?: number,
	max?: number,
	precision?: number
}

/**
 * Field for angular inputs. Values are in degrees.
 */
interface IAngleInput extends IAbstractField {
	type: "field_angle";
	angle: number;
}

/**
 * Field for selectable options.
 */
interface IDropDownInput extends IAbstractField {
	type: "field_dropdown";
	options: [string, string][];
}

/**
 * Field for checkboxes.
 */
interface ICheckboxInput extends IAbstractField {
	type: "field_checkbox";
	checked: boolean;
}

/**
 * Field for color input.
 */
interface IColorInput extends IAbstractField {
	type: "field_colour";
	colour: string;
}

/**
 * Field for variable selection.
 */
interface IVariableInput extends IAbstractField {
	type: "field_variable";
	variable: string;
	variableTypes?: string[];
	defaultType?: string;
}

/**
 * Field for static images.
 */
interface IInlineImage extends IAbstractField {
	type: "field_image";
	src: string;
	width: number;
	height: number;
	alt: string;
	flipRtl: boolean;
}

/**
 * Input for blocks with left outputs.
 */
interface IValueInput extends IAbstractInput {
	type: "input_value";
}

/**
 * Input for blocks with top-down connections.
 */
interface IStatementInput extends IAbstractInput {
	type: "input_statement";
}

/**
 * Input for nothing ~ placeholder for a line with no inputs.
 */
interface IDummyInput extends IAbstractInput {
	type: "input_dummy";
}

/**
 * Fields that are used in a block.
 */
type BlockField = ISerializableLabel | ITextInput | INumberInput
	| IAngleInput | IDropDownInput | ICheckboxInput | IColorInput
	| IVariableInput | IInlineImage;

/**
 * Inputs that are used in a block.
 */
type BlockInput = IValueInput | IStatementInput | IDummyInput;

/**
 * Blockly's JSON block definition type, but stricter.
 */
// Avoid name collisions with Blockly's BlockDefinition: any
// Only took an hour to do all the type gymnastics
export interface FBlockDefinition {
	type: string;
	message0?: string;
	args0?: (BlockField | BlockInput)[];
	inputsInline?: boolean;
	output?: string | null;
	previousStatement?: string | null;
	nextStatement?: string | null;
	colour?: number;
	style?: string;
	tooltip?: string;
	helpUrl?: string;
	enableContextMenu?: boolean;
	mutator?: string;
	extensions?: string[];
}