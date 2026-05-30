import { liveEvidenceCopy } from "../content/uiCopy";
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
          <dd>{formatQualityLabel(calibration.qualityLevel)}</dd>
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
            {formatRange(evidence.minimumMonthly, evidence.maximumMonthly)}
          </dd>
        </div>
        <div className="metric-card">
          <dt>Freshness</dt>
          <dd>{calibration.freshnessLabel}</dd>
        </div>
      </dl>
      <div className="live-calibration-grid" aria-label="Live evidence calibration">
        <p>{liveEvidenceCopy.quality[calibration.qualityLevel]}</p>
        <p>{calibration.sampleSizeLabel}</p>
        <p>{formatSpread(calibration.spreadPercent)}</p>
      </div>
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
                  {formatPropertyType(listing.propertyType)}
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
          {calibration.reasons.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
          {evidence.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatOptionalCurrency(value: number | undefined): string {
  return value === undefined ? "Unavailable" : formatCurrency(value);
}

function formatSignedCurrency(value: number | undefined): string {
  if (value === undefined) return "Unavailable";
  if (value === 0) return formatCurrency(0);
  return `${value > 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function formatRange(minimum: number | undefined, maximum: number | undefined): string {
  if (minimum === undefined || maximum === undefined) return "Unavailable";
  return `${formatCurrency(minimum)} to ${formatCurrency(maximum)}`;
}

function formatSpread(value: number | undefined): string {
  if (value === undefined) return "Range spread unavailable";
  return `Range spread ${value.toFixed(1)}% around the median`;
}

function formatQualityLabel(
  value: "limited" | "useful" | "strong"
): string {
  if (value === "limited") return "Limited";
  if (value === "useful") return "Useful";
  return "Strong";
}

function formatPropertyType(value: string | undefined): string {
  if (!value || value === "unknown") return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatListingDate(value: string | undefined): string {
  const date = parseListingDate(value);
  if (!date) return "Unknown";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function parseListingDate(value: string | undefined): Date | null {
  if (!value) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return buildUtcDate(isoMatch[1], isoMatch[2], isoMatch[3]);

  const ukMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) return buildUtcDate(ukMatch[3], ukMatch[2], ukMatch[1]);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildUtcDate(year: string, month: string, day: string): Date | null {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}
