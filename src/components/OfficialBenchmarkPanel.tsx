import {
  officialBenchmarkCopy,
  officialBenchmarkStatusCopy
} from "../content/uiCopy";
import { capitaliseFirst, formatDateLong, formatMonthLong } from "../lib/displayFormat";
import type { OfficialBenchmarkComparison } from "../types/officialRentBenchmark";

type OfficialBenchmarkPanelProps = {
  comparison: OfficialBenchmarkComparison;
  sourceUrl: string;
  releaseDate: string;
  period: string;
};

export function OfficialBenchmarkPanel({
  comparison,
  sourceUrl,
  releaseDate,
  period
}: OfficialBenchmarkPanelProps) {
  return (
    <section className="official-benchmark-panel" aria-labelledby="official-benchmark-title">
      <div className="result-header">
        <div>
          <p className="label">Official benchmark</p>
          <h2 id="official-benchmark-title">{officialBenchmarkCopy.title}</h2>
        </div>
        <span className="status-badge">
          {officialBenchmarkStatusCopy[comparison.status]}
        </span>
      </div>

      <p>{officialBenchmarkCopy.summary}</p>
      <p className="evidence-warning">{officialBenchmarkCopy.notice}</p>

      <dl className="benchmark-detail-grid">
        <div>
          <dt>Local Authority</dt>
          <dd>{comparison.benchmark.areaName}</dd>
        </div>
        <div>
          <dt>ONS period</dt>
          <dd>{formatMonthLong(period)}</dd>
        </div>
        <div>
          <dt>Selected benchmark</dt>
          <dd>{capitaliseFirst(comparison.selection.label)}</dd>
        </div>
      </dl>

      <p className="benchmark-threshold-note">{officialBenchmarkCopy.threshold}</p>
      <p className="benchmark-source-line">
        Release checked: {formatDateLong(releaseDate)}. Source:{" "}
        <a href={sourceUrl} rel="noreferrer" target="_blank">
          {officialBenchmarkCopy.sourceLabel}
        </a>
      </p>
    </section>
  );
}
