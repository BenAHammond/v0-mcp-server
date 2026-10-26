import type { Flow } from "../flow.js";
import { serverSurface } from "./server-surface.js";
import { sdkDiscoveryRemoved } from "./sdk-discovery.js";
import { generateExposesResponseMode } from "./generate-response-mode.js";
import { initCodeToolRegistered, resolveTaskToolRegistered } from "./agent-tools.js";
import { deployLogsAndErrorsRegistered } from "./deploy-tools.js";
import { versionToolsRegistered } from "./version-tools.js";
import { reportToolsRegistered } from "./report-tools.js";
import { projectEnvToolsRegistered } from "./project-tools.js";
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
  generateExposesResponseMode,
  initCodeToolRegistered,
  resolveTaskToolRegistered,
  deployLogsAndErrorsRegistered,
  versionToolsRegistered,
  reportToolsRegistered,
  projectEnvToolsRegistered,
  networkFreeToolCall,
  unknownToolRefusal,
  missingParamRefusal,
  auditDismissalsDryFindings,
  falseGreenInspectorRemoved,
  versionFromPackageJson,
  cliBannerToStderr,
  isErrorOnFailure,
];
