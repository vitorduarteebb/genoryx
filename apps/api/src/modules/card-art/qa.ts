import { cardArtGenerationConfig } from "@nexora/config";
import type { CardArtQaReport } from "./providers/types";

export function cardArtQaAccepted(report: CardArtQaReport): boolean {
  return report.overallScore >= cardArtGenerationConfig.qaThreshold && report.criticalErrors.length === 0;
}
