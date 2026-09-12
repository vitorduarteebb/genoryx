import { visualGenerationConfig } from "@nexora/config";
import type { VisualQaReport } from "./providers/types";

export function qaAccepted(report: VisualQaReport): boolean {
  return report.overallScore >= visualGenerationConfig.qaThreshold && report.criticalErrors.length === 0;
}
