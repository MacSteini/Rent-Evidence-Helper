import { evidenceSummaryCopy } from "../content/uiCopy";
import { buildEvidenceSummary } from "../lib/evidenceSummary";
import type { RentCheckResult } from "../types/rentCheckResult";

type EvidenceSummaryPanelProps = {
  result: RentCheckResult;
};

export function EvidenceSummaryPanel({ result }: EvidenceSummaryPanelProps) {
  const summary = buildEvidenceSummary(result);

  return (
    <section className="evidence-summary-panel" aria-labelledby="evidence-summary-title">
      <div className="section-heading">
        <h2 id="evidence-summary-title">{evidenceSummaryCopy.title}</h2>
        <p>{evidenceSummaryCopy.summary}</p>
      </div>
      <dl className="evidence-summary-list">
        <div>
          <dt>{evidenceSummaryCopy.onsLabel}</dt>
          <dd>{summary.onsStatus}</dd>
        </div>
        <div>
          <dt>{evidenceSummaryCopy.pmiLabel}</dt>
          <dd>{summary.pmiStatus}</dd>
        </div>
        <div>
          <dt>{evidenceSummaryCopy.actionLabel}</dt>
          <dd>{summary.recommendedAction}</dd>
        </div>
      </dl>
    </section>
  );
}
