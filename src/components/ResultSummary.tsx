import { fieldCopy, confidenceLabel, resultCopy } from "../content/uiCopy";
import { formatCurrency } from "../lib/rentMath";
import type { AssessmentResult } from "../lib/assessment";

type ResultSummaryProps = {
  result: AssessmentResult;
};

export function ResultSummary({ result }: ResultSummaryProps) {
  const copy = resultCopy[result.estimate.status];
  const confidencePercent = Math.round(result.estimate.confidenceScore * 100);

  return (
    <article className={`result-panel severity-${copy.severity}`}>
      <div className="result-header">
        <div>
          <p className="label">Result</p>
          <h2>{copy.headline}</h2>
        </div>
        <span className="status-badge">{confidenceLabel(result.estimate.confidence)}</span>
      </div>

      <p>{copy.summary}</p>
      <p className="fixture-warning">{fieldCopy.fixtureNotice}</p>

      <dl className="metric-grid">
        <div>
          <dt>Your monthly rent</dt>
          <dd>{formatCurrency(result.estimate.userRentMonthly)}</dd>
        </div>
        <div>
          <dt>Estimated range</dt>
          <dd>{result.estimate.estimatedRangeLabel}</dd>
        </div>
        <div>
          <dt>Median comparable</dt>
          <dd>
            {result.estimate.estimatedMedianMonthly
              ? formatCurrency(result.estimate.estimatedMedianMonthly)
              : "Unavailable"}
          </dd>
        </div>
        <div>
          <dt>Comparable sample</dt>
          <dd>{result.estimate.comparableCount}</dd>
        </div>
      </dl>

      <div className="range-chart" role="img" aria-label={buildChartLabel(result)}>
        <div className="range-track">
          <span className="range-fill" style={{ width: `${chartWidth(result)}%` }} />
        </div>
        <div className="range-labels" aria-hidden="true">
          <span>Lower quartile</span>
          <span>Your rent</span>
          <span>Upper quartile</span>
        </div>
      </div>

      <div className="confidence-block">
        <div>
          <strong>Confidence score</strong>
          <span>{confidencePercent}%</span>
        </div>
        <meter min="0" max="100" low={48} high={72} optimum={90} value={confidencePercent}>
          {confidencePercent}%
        </meter>
      </div>

      {result.estimate.warnings.length > 0 && (
        <div className="warning-list">
          <h3>Evidence limitations</h3>
          <ul>
            {result.estimate.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function chartWidth(result: AssessmentResult): number {
  const max =
    result.estimate.estimatedUpperQuartileMonthly ??
    result.estimate.observedMaximumMonthly ??
    result.estimate.userRentMonthly;
  return Math.max(8, Math.min(100, (result.estimate.userRentMonthly / max) * 85));
}

function buildChartLabel(result: AssessmentResult): string {
  return `Your monthly rent is ${formatCurrency(
    result.estimate.userRentMonthly
  )}. The estimated comparable range is ${result.estimate.estimatedRangeLabel}.`;
}
