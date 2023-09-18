// Workarounds for Blockly's suboptimal type declarations

import { Events, Input, VariableModel } from "blockly";
import { BlockChange } from "blockly/core/events/events_block_change";
import { BlockCreate } from "blockly/core/events/events_block_create";
import { BlockDelete } from "blockly/core/events/events_block_delete";
import { BlockDrag } from "blockly/core/events/events_block_drag";
import { BlockMove } from "blockly/core/events/events_block_move";

// This code smells like s**t - Random guy from the UK
// See google/blockly#6920: (This is kludgy.)
type InputWithCreatedVariables = Input & {
    oldShowEditorFn_(_e?: Event, quietInput?: boolean): void;
    createdVariables_: VariableModel[];
};

// Don't give a f*** about event types, just pretend it's anything
// - nerd on a TypeScript conversion deadline
// See google/blockly#6920
type BlockAny =
    (BlockChange & { type: typeof Events.BLOCK_CHANGE }) |
    (BlockCreate & { type: typeof Events.BLOCK_CREATE }) |
    (BlockDelete & { type: typeof Events.BLOCK_DELETE }) |
    (BlockDrag & { type: typeof Events.BLOCK_DRAG }) |
    (BlockMove & { type: typeof Events.BLOCK_MOVE });