import { formatCurrency } from "../lib/rentMath";
import type { LiveRentalEvidenceResult } from "../types/liveEvidence";

type LiveEvidencePanelProps = {
  evidence: LiveRentalEvidenceResult;
};

export function LiveEvidencePanel({ evidence }: LiveEvidencePanelProps) {
  return (
    <section
      className="live-evidence-panel"
      aria-labelledby="live-evidence-title"
    >
      <div className="result-header">
        <div>
          <p className="label">Live evidence</p>
          <h2 id="live-evidence-title">Live rental listings</h2>
        </div>
        <span className="status-badge">Property Market Intel</span>
      </div>
      <p>
        Live asking-rent listings for the search area. These are not achieved
        rents, a tribunal decision or legal advice.
      </p>
      <dl className="metric-grid">
        <div className="metric-card">
          <dt>Listings used</dt>
          <dd>{evidence.displayedCount}</dd>
        </div>
        <div className="metric-card metric-card-wide">
          <dt>Median asking rent</dt>
          <dd>{formatOptionalCurrency(evidence.medianMonthly)}</dd>
        </div>
        <div className="metric-card metric-card-wide">
          <dt>Observed range</dt>
          <dd>
            {formatRange(evidence.minimumMonthly, evidence.maximumMonthly)}
          </dd>
        </div>
      </dl>
      <div className="table-wrap">
        <table>
          <caption>
            Selected PMI rental listings. Exact addresses and UPRNs are not shown.
          </caption>
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
                  {listing.listedDate ?? "Unknown"}
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

function formatRange(minimum: number | undefined, maximum: number | undefined): string {
  if (minimum === undefined || maximum === undefined) return "Unavailable";
  return `${formatCurrency(minimum)} to ${formatCurrency(maximum)}`;
}

function formatPropertyType(value: string | undefined): string {
  if (!value || value === "unknown") return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

