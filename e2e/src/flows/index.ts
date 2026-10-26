import type { Flow } from "../flow.js";
import { serverSurface } from "./server-surface.js";
import { sdkDiscoveryRemoved } from "./sdk-discovery.js";
import { searchManifest } from "./search-manifest.js";
import { requestFoldedOp } from "./request-folded-op.js";
import { generateExposesResponseMode } from "./generate-response-mode.js";
import { networkFreeToolCall, unknownToolRefusal, missingParamRefusal } from "./tool-call.js";
import { auditDismissalsDryFindings } from "./audit-dismissals.js";
import { falseGreenInspectorRemoved } from "./inspector-test.js";
import { versionFromPackageJson } from "./version-string.js";
import { cliBannerToStderr } from "./cli-banner.js";
import { isErrorOnFailure } from "./iserror.js";

/** The acceptance suite, in run order. */
export const flows: Flow[] = [
  serverSurface,
  sdkDiscoveryRemoved,
  searchManifest,
  requestFoldedOp,
  generateExposesResponseMode,
  networkFreeToolCall,
  unknownToolRefusal,
  missingParamRefusal,
  auditDismissalsDryFindings,
  falseGreenInspectorRemoved,
  versionFromPackageJson,
  cliBannerToStderr,
  isErrorOnFailure,
];
