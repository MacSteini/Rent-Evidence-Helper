import {
  evidenceSummaryCopy,
  deeperComparableCopy,
  officialBenchmarkStatusCopy
} from "../content/uiCopy";
import { calibrateLiveRentalEvidence } from "./liveEvidenceCalibration";
import type { RentCheckResult } from "../types/rentCheckResult";

export type EvidenceSummary = {
  onsStatus: string;
  pmiStatus: string;
  deeperStatus?: string;
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
      deeperStatus: result.deeperComparableEvidence
        ? deeperComparableCopy.available
        : undefined,
      recommendedAction: evidenceSummaryCopy.actionWithPmi
    };
  }

  return {
    onsStatus,
    pmiStatus:
      result.evidenceMode === "official-with-pmi-warning"
        ? evidenceSummaryCopy.pmiWarning
        : evidenceSummaryCopy.pmiOnly,
    deeperStatus: result.deeperComparableEvidence
      ? deeperComparableCopy.available
      : undefined,
    recommendedAction: evidenceSummaryCopy.actionWithoutPmi
  };
}
