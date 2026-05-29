import { formatCurrency } from "../lib/rentMath";
import type { ComparableRent } from "../types/rent";

type EvidenceTableProps = {
  comparables: ComparableRent[];
  searchAreaDescription: string;
};

export function EvidenceTable({
  comparables,
  searchAreaDescription
}: EvidenceTableProps) {
  return (
    <section className="panel" aria-labelledby="evidence-title">
      <div className="section-heading">
        <p className="label">Evidence</p>
        <h2 id="evidence-title">Comparable homes</h2>
        <p>{searchAreaDescription}</p>
      </div>
      <div className="table-wrap">
        <table>
          <caption>
            Fixture comparable rents used for the estimate. These are sample data
            points, not live listings.
          </caption>
          <thead>
            <tr>
              <th scope="col">Area</th>
              <th scope="col">Property</th>
              <th scope="col">Bedrooms</th>
              <th scope="col">Monthly rent</th>
              <th scope="col">Observed</th>
              <th scope="col">Match</th>
            </tr>
          </thead>
          <tbody>
            {comparables.map((comparable) => (
              <tr key={comparable.id}>
                <td>{comparable.postcodeSector ?? "Unknown"}</td>
                <td>{comparable.propertyType ?? "Unknown"}</td>
                <td>{comparable.bedrooms ?? "Unknown"}</td>
                <td>{formatCurrency(comparable.rentMonthly)}</td>
                <td>{formatDate(comparable.observedAt)}</td>
                <td>{comparable.matchType ?? "unknown"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}
