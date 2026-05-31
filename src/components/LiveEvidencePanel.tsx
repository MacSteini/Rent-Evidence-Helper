import { liveEvidenceCopy } from "../content/uiCopy";
import {
  formatCurrencyRange,
  formatLiveQualityLabel,
  formatListingDate,
  formatOptionalCurrency,
  formatPropertyTypeLabel,
  formatSignedCurrency,
  formatSpread
} from "../lib/displayFormat";
import { calibrateLiveRentalEvidence } from "../lib/liveEvidenceCalibration";
import { formatCurrency } from "../lib/rentMath";
import type { LiveRentalEvidenceResult } from "../types/liveEvidence";

type LiveEvidencePanelProps = {
  evidence: LiveRentalEvidenceResult;
  userRentMonthly: number;
};

export function LiveEvidencePanel({
  evidence,
  userRentMonthly
}: LiveEvidencePanelProps) {
  const calibration = calibrateLiveRentalEvidence(evidence, userRentMonthly);

  return (
    <section
      className="live-evidence-panel"
      aria-labelledby="live-evidence-title"
    >
      <div className="result-header">
        <div>
          <p className="label">Live evidence</p>
          <h2 id="live-evidence-title">{liveEvidenceCopy.title}</h2>
        </div>
        <span className="status-badge">Property Market Intel</span>
      </div>
      <p>{liveEvidenceCopy.summary}</p>
      <p className="live-evidence-interpretation">
        {liveEvidenceCopy.interpretation[calibration.rentPosition]}
      </p>
      <dl className="metric-grid">
        <div className="metric-card">
          <dt>Listings used</dt>
          <dd>{evidence.displayedCount}</dd>
        </div>
        <div className="metric-card metric-card-wide">
          <dt>Live context quality</dt>
          <dd>{formatLiveQualityLabel(calibration.qualityLevel)}</dd>
        </div>
        <div className="metric-card metric-card-wide">
          <dt>Median asking rent</dt>
          <dd>{formatOptionalCurrency(evidence.medianMonthly)}</dd>
        </div>
        <div className="metric-card metric-card-wide">
          <dt>Compared with your rent</dt>
          <dd>{formatSignedCurrency(calibration.medianDifferenceMonthly)}</dd>
        </div>
        <div className="metric-card metric-card-wide">
          <dt>Observed range</dt>
          <dd>
            {formatCurrencyRange(evidence.minimumMonthly, evidence.maximumMonthly)}
          </dd>
        </div>
        <div className="metric-card">
          <dt>Freshness</dt>
          <dd>{calibration.freshnessLabel}</dd>
        </div>
      </dl>
      <div className="table-wrap">
        <table>
          <caption>{liveEvidenceCopy.caption}</caption>
          <thead>
            <tr>
              <th scope="col">Area</th>
              <th scope="col">Type</th>
              <th scope="col">Beds</th>
              <th scope="col">Asking rent</th>
              <th scope="col">Listed</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {evidence.listings.map((listing) => (
              <tr key={listing.id}>
                <td>
                  <span className="cell-label">Area</span>
                  {listing.postcodeSector ?? evidence.searchAreaDescription}
                </td>
                <td>
                  <span className="cell-label">Type</span>
                  {formatPropertyTypeLabel(listing.propertyType)}
                </td>
                <td>
                  <span className="cell-label">Beds</span>
                  {listing.bedrooms ?? "Unknown"}
                </td>
                <td>
                  <span className="cell-label">Asking rent</span>
                  {formatCurrency(listing.rentMonthly)}
                </td>
                <td>
                  <span className="cell-label">Listed</span>
                  {formatListingDate(listing.listedDate)}
                </td>
                <td>
                  <span className="cell-label">Source</span>
                  {listing.sourceUrl ? (
                    <a href={listing.sourceUrl} target="_blank" rel="noreferrer">
                      View listing
                    </a>
                  ) : (
                    "PMI"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="warning-list" aria-label="Live evidence notes">
        <div>
          <p>{liveEvidenceCopy.quality[calibration.qualityLevel]}</p>
          <p>
            {calibration.sampleSizeLabel}. {formatSpread(calibration.spreadPercent)}
          </p>
          {calibration.freshnessLabel === "Unknown freshness" && (
            <p>Unknown listing dates: most usable listings do not include a date.</p>
          )}
          {evidence.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
