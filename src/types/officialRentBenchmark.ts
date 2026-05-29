export type OfficialRentBenchmarkEvidenceKind = "official-area-benchmark";

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
