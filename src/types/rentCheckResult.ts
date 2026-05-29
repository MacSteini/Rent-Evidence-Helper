import type {
  OfficialBenchmarkComparison
} from "./officialRentBenchmark";
import type { LiveRentalEvidenceResult } from "./liveEvidence";
import type { RentSearchInput } from "./rent";

export type EvidenceMode =
  | "official-only"
  | "official-with-pmi-live"
  | "official-with-pmi-warning";

export type RentCheckResult = {
  input: RentSearchInput;
  officialBenchmarkComparison: OfficialBenchmarkComparison;
  liveEvidence?: LiveRentalEvidenceResult;
  warnings: string[];
  evidenceMode: EvidenceMode;
};

