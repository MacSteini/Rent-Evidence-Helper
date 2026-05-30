import { deeperComparableCopy } from "../content/uiCopy";
import { formatCurrency } from "../lib/rentMath";
import type { DeeperComparableEvidenceResult } from "../types/liveEvidence";
import type { RentSearchInput } from "../types/rent";

type DeeperComparablePanelProps = {
  input: RentSearchInput;
  evidence?: DeeperComparableEvidenceResult;
  canRun: boolean;
  isRunning: boolean;
  error: string | null;
  onRun: () => void;
};

export function DeeperComparablePanel({
  input,
  evidence,
  canRun,
  isRunning,
  error,
  onRun
}: DeeperComparablePanelProps) {
  const searchArea = evidence?.searchAreaDescription ?? derivePostcodeSectorLabel(input);

  return (
    <section
      className="deeper-comparable-panel"
      aria-labelledby="deeper-comparable-title"
    >
      <div className="section-heading">
        <h2 id="deeper-comparable-title">{deeperComparableCopy.title}</h2>
        <p>{deeperComparableCopy.summary}</p>
      </div>

      <p className="evidence-warning">{deeperComparableCopy.creditWarning}</p>
      <dl className="benchmark-detail-grid">
        <div>
          <dt>Search area</dt>
          <dd>{searchArea}</dd>
        </div>
        {evidence && (
          <>
            <div>
              <dt>Comparable records</dt>
              <dd>{evidence.displayedCount}</dd>
            </div>
            <div>
              <dt>Median comparable rent</dt>
              <dd>
                {evidence.medianMonthly === undefined
                  ? "Unavailable"
                  : formatCurrency(evidence.medianMonthly)}
              </dd>
            </div>
            <div>
              <dt>Range</dt>
              <dd>{formatRange(evidence.minimumMonthly, evidence.maximumMonthly)}</dd>
            </div>
          </>
        )}
      </dl>

      {!evidence && canRun && (
        <button
          type="button"
          className="secondary-button"
          disabled={isRunning}
          onClick={onRun}
        >
          {isRunning ? deeperComparableCopy.loading : deeperComparableCopy.button}
        </button>
      )}
      {!evidence && !canRun && (
        <p className="benchmark-threshold-note">{deeperComparableCopy.noKey}</p>
      )}
      {error && (
        <div className="notice notice-compact" role="status">
          <p>{error}</p>
        </div>
      )}

      {evidence && (
        <>
          <p className="live-evidence-interpretation">{deeperComparableCopy.status}</p>
          <div className="table-wrap">
            <table>
              <caption>{deeperComparableCopy.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">Area</th>
                  <th scope="col">Type</th>
                  <th scope="col">Bedrooms</th>
                  <th scope="col">Rent</th>
                  <th scope="col">Date</th>
                  <th scope="col">Distance</th>
                </tr>
              </thead>
              <tbody>
                {evidence.comparables.map((comparable) => (
                  <tr key={comparable.id}>
                    <td data-label="Area">
                      <span className="cell-label">Area</span>
                      <span>{comparable.postcodeSector ?? "Not shown"}</span>
                    </td>
                    <td data-label="Type">
                      <span className="cell-label">Type</span>
                      <span>{formatPropertyType(comparable.propertyType)}</span>
                    </td>
                    <td data-label="Bedrooms">
                      <span className="cell-label">Bedrooms</span>
                      <span>{comparable.bedrooms ?? "Unknown"}</span>
                    </td>
                    <td data-label="Rent">
                      <span className="cell-label">Rent</span>
                      <span>{formatCurrency(comparable.rentMonthly)}</span>
                    </td>
                    <td data-label="Date">
                      <span className="cell-label">Date</span>
                      <span>{formatDate(comparable.evidenceDate)}</span>
                    </td>
                    <td data-label="Distance">
                      <span className="cell-label">Distance</span>
                      <span>{formatDistance(comparable.distanceMeters)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="warning-list" aria-label="Deeper comparable notes">
            <div>
              {evidence.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function derivePostcodeSectorLabel(input: RentSearchInput): string {
  const parts = input.postcode.trim().toUpperCase().split(/\s+/);
  if (parts.length === 2 && parts[1]) return `${parts[0]} ${parts[1][0]}`;
  return "postcode sector";
}

function formatRange(minimum: number | undefined, maximum: number | undefined): string {
  if (minimum === undefined || maximum === undefined) return "Unavailable";
  return `${formatCurrency(minimum)} to ${formatCurrency(maximum)}`;
}

function formatDistance(value: number | undefined): string {
  if (value === undefined) return "Unknown";
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${Math.round(value)} m`;
}

function formatDate(value: string | undefined): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatPropertyType(value: string | undefined): string {
  if (!value) return "Unknown";
  return value.replace(/-/g, " ");
}
