import {
  evidenceSummaryCopy,
  deeperComparableCopy,
  officialBenchmarkStatusCopy
} from "../content/uiCopy";
import {
  calibrateDeeperComparableEvidence,
  calibrateLiveRentalEvidence,
  comparePmiEvidenceLayers
} from "./liveEvidenceCalibration";
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
      deeperStatus: buildDeeperStatus(result),
      recommendedAction: evidenceSummaryCopy.actionWithPmi
    };
  }

  return {
    onsStatus,
    pmiStatus:
      result.evidenceMode === "official-with-pmi-warning"
        ? evidenceSummaryCopy.pmiWarning
        : evidenceSummaryCopy.pmiOnly,
    deeperStatus: buildDeeperStatus(result),
    recommendedAction: evidenceSummaryCopy.actionWithoutPmi
  };
}

function buildDeeperStatus(result: RentCheckResult): string | undefined {
  if (!result.deeperComparableEvidence) return undefined;

  const deeperCalibration = calibrateDeeperComparableEvidence(
    result.deeperComparableEvidence,
    result.officialBenchmarkComparison.userRentMonthly
  );
  const disagreement = comparePmiEvidenceLayers(
    result.liveEvidence,
    result.deeperComparableEvidence
  );

  if (disagreement.status === "materially-different") {
    return deeperComparableCopy.disagreement;
  }

  return `${deeperComparableCopy.available}; ${
    evidenceSummaryCopy.pmiQuality[deeperCalibration.qualityLevel]
  }.`;
}
