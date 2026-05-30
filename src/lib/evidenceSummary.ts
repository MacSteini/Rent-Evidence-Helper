import {
  evidenceSummaryCopy,
  officialBenchmarkStatusCopy
} from "../content/uiCopy";
import { calibrateLiveRentalEvidence } from "./liveEvidenceCalibration";
import type { RentCheckResult } from "../types/rentCheckResult";

export type EvidenceSummary = {
  onsStatus: string;
  pmiStatus: string;
  recommendedAction: string;
};

export function buildEvidenceSummary(result: RentCheckResult): EvidenceSummary {
  const onsStatus =
    officialBenchmarkStatusCopy[result.officialBenchmarkComparison.status];

  if (result.liveEvidence) {
    const calibration = calibrateLiveRentalEvidence(
      result.liveEvidence,
      result.officialBenchmarkComparison.userRentMonthly
    );

    return {
      onsStatus,
      pmiStatus: `${
        evidenceSummaryCopy.pmiQuality[calibration.qualityLevel]
      }; ${evidenceSummaryCopy.pmiPosition[calibration.rentPosition]}.`,
      recommendedAction: evidenceSummaryCopy.actionWithPmi
    };
  }

  return {
    onsStatus,
    pmiStatus:
      result.evidenceMode === "official-with-pmi-warning"
        ? evidenceSummaryCopy.pmiWarning
        : evidenceSummaryCopy.pmiOnly,
    recommendedAction: evidenceSummaryCopy.actionWithoutPmi
  };
}
