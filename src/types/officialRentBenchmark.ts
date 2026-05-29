export type OfficialRentBenchmarkEvidenceKind = "official-area-benchmark";

export type OfficialBenchmarkField =
  | "monthlyRentAll"
  | "monthlyRentOneBed"
  | "monthlyRentTwoBed"
  | "monthlyRentThreeBed"
  | "monthlyRentFourOrMoreBed"
  | "monthlyRentFlatMaisonette";

export type OfficialBenchmarkStatus =
  | "below_benchmark"
  | "near_benchmark"
  | "above_benchmark"
  | "substantially_above_benchmark";

export type OfficialRentBenchmark = {
  areaCode: string;
  areaName: string;
  regionOrCountryName: string;
  period: string;
  monthlyRentAll: number;
  monthlyRentOneBed: number;
  monthlyRentTwoBed: number;
  monthlyRentThreeBed: number;
  monthlyRentFourOrMoreBed: number;
  monthlyRentFlatMaisonette: number;
};

export type OfficialRentBenchmarkDataset = {
  schemaVersion: 1;
  evidenceKind: OfficialRentBenchmarkEvidenceKind;
  sourceName: "ONS Price Index of Private Rents";
  sourceUrl: string;
  sourceFileUrl?: string;
  releaseDate: string;
  nextRelease: string;
  period: string;
  lastIngestedAt: string;
  sourceSha256: string;
  benchmarks: OfficialRentBenchmark[];
};

export type OfficialBenchmarkSelection = {
  field: OfficialBenchmarkField;
  label: string;
  monthlyRent: number;
};

export type OfficialBenchmarkComparison = {
  benchmark: OfficialRentBenchmark;
  selection: OfficialBenchmarkSelection;
  userRentMonthly: number;
  differenceMonthly: number;
  percentageDifference: number;
  status: OfficialBenchmarkStatus;
};
