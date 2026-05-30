import { fieldCopy, liveEvidenceCopy, resultCopy } from "../content/uiCopy";
import { formatCurrency } from "../lib/rentMath";
import type { RentCheckResult } from "../types/rentCheckResult";

type ResultSummaryProps = {
  result: RentCheckResult;
};

export function ResultSummary({ result }: ResultSummaryProps) {
  const comparison = result.officialBenchmarkComparison;
  const copy = resultCopy[comparison.status];

  return (
    <article className={`result-panel severity-${copy.severity}`}>
      <div className="result-header">
        <div>
          <p className="label">Result</p>
          <h2>{copy.headline}</h2>
        </div>
        <span className="status-badge">ONS benchmark</span>
      </div>

      <p>{copy.summary}</p>
      {result.liveEvidence && result.liveEvidence.medianMonthly !== undefined && (
        <p>
          {liveEvidenceCopy.resultSummary} PMI found{" "}
          {result.liveEvidence.displayedCount} live asking-rent listings, with
          a median asking rent of{" "}
          {formatCurrency(result.liveEvidence.medianMonthly)} per month.
        </p>
      )}
      <p className="evidence-warning">{fieldCopy.evidenceNotice}</p>

      <dl className="metric-grid">
        <div className="metric-card">
          <dt>Your monthly rent</dt>
          <dd>{formatCurrency(comparison.userRentMonthly)}</dd>
        </div>
        <div className="metric-card metric-card-wide">
          <dt>Official benchmark</dt>
          <dd>{formatCurrency(comparison.selection.monthlyRent)}</dd>
        </div>
        <div className="metric-card">
          <dt>Monthly difference</dt>
          <dd>{formatSignedCurrency(comparison.differenceMonthly)}</dd>
        </div>
        <div className="metric-card metric-card-compact">
          <dt>Difference</dt>
          <dd>{formatSignedPercent(comparison.percentageDifference)}</dd>
        </div>
      </dl>
    </article>
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
