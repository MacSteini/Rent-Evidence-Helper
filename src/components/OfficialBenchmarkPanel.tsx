import {
  officialBenchmarkCopy,
  officialBenchmarkStatusCopy
} from "../content/uiCopy";
import { formatCurrency } from "../lib/rentMath";
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
          <dd>{formatMonth(period)}</dd>
        </div>
        <div>
          <dt>Selected benchmark</dt>
          <dd>{comparison.selection.label}</dd>
        </div>
        <div>
          <dt>Official benchmark rent</dt>
          <dd>{formatCurrency(comparison.selection.monthlyRent)}</dd>
        </div>
        <div>
          <dt>Your monthly rent</dt>
          <dd>{formatCurrency(comparison.userRentMonthly)}</dd>
        </div>
        <div>
          <dt>Difference</dt>
          <dd>
            {formatSignedCurrency(comparison.differenceMonthly)} (
            {formatSignedPercent(comparison.percentageDifference)})
          </dd>
        </div>
      </dl>

      <p className="benchmark-threshold-note">{officialBenchmarkCopy.threshold}</p>
      <p className="benchmark-source-line">
        Release checked: {formatDate(releaseDate)}. Source:{" "}
        <a href={sourceUrl} rel="noreferrer" target="_blank">
          {officialBenchmarkCopy.sourceLabel}
        </a>
      </p>
    </section>
  );
}

function formatSignedCurrency(value: number): string {
  if (value === 0) return formatCurrency(0);
  return `${value > 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function formatSignedPercent(value: number): string {
  const rounded = Math.abs(value).toFixed(1);
  if (value === 0) return "0.0%";
  return `${value > 0 ? "+" : "-"}${rounded}%`;
}

function formatMonth(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}
