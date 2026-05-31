import { deeperComparableCopy } from "../content/uiCopy";
import {
  formatCurrencyRange,
  formatDistance,
  formatPropertyTypeLabel,
  formatRecentRecordQualityLabel,
  formatSearchAreaLabel,
  formatSignedCurrency,
  formatSpread
} from "../lib/displayFormat";
import { formatEvidenceDate, formatEvidenceDateRange } from "../lib/evidenceDates";
import { calibrateDeeperComparableEvidence } from "../lib/liveEvidenceCalibration";
import { formatCurrency } from "../lib/rentMath";
import type { DeeperComparableEvidenceResult } from "../types/liveEvidence";
import type { RentSearchInput } from "../types/rent";

type DeeperComparablePanelProps = {
  input: RentSearchInput;
  evidence?: DeeperComparableEvidenceResult;
  hasLiveEvidence: boolean;
  canRun: boolean;
  cooldownSeconds: number;
  isRunning: boolean;
  error: string | null;
  onRun: () => void;
};

export function DeeperComparablePanel({
  input,
  evidence,
  hasLiveEvidence,
  canRun,
  cooldownSeconds,
  isRunning,
  error,
  onRun
}: DeeperComparablePanelProps) {
  const searchArea = formatSearchAreaLabel(
    evidence?.searchAreaDescription ?? derivePostcodeSectorLabel(input)
  );
  const isWaitingForPmi = cooldownSeconds > 0;
  const calibration = evidence
    ? calibrateDeeperComparableEvidence(evidence, Number(input.rentAmount))
    : null;

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
              <dt>Recent records</dt>
              <dd>{evidence.displayedCount}</dd>
            </div>
            <div>
              <dt>Record context</dt>
              <dd>{formatRecentRecordQualityLabel(calibration?.qualityLevel)}</dd>
            </div>
            <div>
              <dt>Median record rent</dt>
              <dd>
                {evidence.medianMonthly === undefined
                  ? "Unavailable"
                  : formatCurrency(evidence.medianMonthly)}
              </dd>
            </div>
            <div>
              <dt>Range</dt>
              <dd>{formatCurrencyRange(evidence.minimumMonthly, evidence.maximumMonthly)}</dd>
            </div>
            <div>
              <dt>Record window</dt>
              <dd>
                {formatEvidenceDateRange(
                  evidence.dateWindowStart,
                  evidence.dateWindowEnd
                )}
              </dd>
            </div>
            <div>
              <dt>Compared with your rent</dt>
              <dd>{formatSignedCurrency(calibration?.medianDifferenceMonthly)}</dd>
            </div>
          </>
        )}
      </dl>

      {!evidence && (canRun || isWaitingForPmi) && (
        <button
          type="button"
          className="secondary-button"
          disabled={isRunning || isWaitingForPmi}
          onClick={onRun}
        >
          {isWaitingForPmi
            ? deeperComparableCopy.wait(cooldownSeconds)
            : isRunning
              ? deeperComparableCopy.loading
              : deeperComparableCopy.button}
        </button>
      )}
      {!evidence && !canRun && !isWaitingForPmi && (
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
          {!hasLiveEvidence && (
            <p className="benchmark-threshold-note">
              {deeperComparableCopy.liveEmptyWithRecords}
            </p>
          )}
          <div className="table-wrap">
            <table>
              <caption>{deeperComparableCopy.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">Area</th>
                  <th scope="col">Type</th>
                  <th scope="col">Bedrooms</th>
                  <th scope="col">Rent</th>
                  <th scope="col">Record date</th>
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
                      <span>{formatPropertyTypeLabel(comparable.propertyType)}</span>
                    </td>
                    <td data-label="Bedrooms">
                      <span className="cell-label">Bedrooms</span>
                      <span>{comparable.bedrooms ?? "Unknown"}</span>
                    </td>
                    <td data-label="Rent">
                      <span className="cell-label">Rent</span>
                      <span>{formatCurrency(comparable.rentMonthly)}</span>
                    </td>
                    <td data-label="Record date">
                      <span className="cell-label">Record date</span>
                      <span>{formatEvidenceDate(comparable.evidenceDate)}</span>
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
          <div className="warning-list" aria-label="Recent rented-record notes">
            <div>
              {calibration && (
                <>
                  <p>{deeperComparableCopy.quality[calibration.qualityLevel]}</p>
                  <p>
                    {calibration.sampleSizeLabel}.{" "}
                    {formatSpread(calibration.spreadPercent)}
                  </p>
                </>
              )}
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
  return "Postcode sector";
}
