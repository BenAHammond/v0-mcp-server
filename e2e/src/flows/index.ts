import type { Flow } from "../flow.js";
import { serverSurface } from "./server-surface.js";
import { networkFreeToolCall, unknownToolRefusal, missingParamRefusal } from "./tool-call.js";

/** The acceptance suite, in run order. */
export const flows: Flow[] = [
  serverSurface,
  networkFreeToolCall,
  unknownToolRefusal,
  missingParamRefusal,
];
