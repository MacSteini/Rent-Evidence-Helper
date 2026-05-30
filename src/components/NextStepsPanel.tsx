import { getLegalContent } from "../content/legalGuidance";
import { resultCopy } from "../content/uiCopy";
import type { OfficialBenchmarkStatus } from "../types/officialRentBenchmark";
import type { TenancyContext } from "../types/rent";
import type { EvidenceMode } from "../types/rentCheckResult";

type NextStepsPanelProps = {
  context: TenancyContext;
  status: OfficialBenchmarkStatus;
  evidenceMode?: EvidenceMode;
};

export function NextStepsPanel({
  context,
  status,
  evidenceMode = "official-only"
}: NextStepsPanelProps) {
  const steps = stepsForContext(context, evidenceMode);
  const tribunal = getLegalContent("first-tier-tribunal");
  const form4a = getLegalContent("form-4a-section-13");

  return (
    <section className="panel" aria-labelledby="next-steps-title">
      <div className="section-heading">
        <h2 id="next-steps-title">What to consider next</h2>
        <p>{resultCopy[status].nextStepIntro}</p>
      </div>
      <div className="check-list">
        {steps.map((step) => (
          <p key={step}>{step}</p>
        ))}
      </div>
      <div className="guidance-grid">
        <article>
          <h3>{form4a.title}</h3>
          <p>{form4a.body}</p>
          <OfficialLinks item={form4a} />
        </article>
        <article>
          <h3>{tribunal.title}</h3>
          <p>{tribunal.body}</p>
          <OfficialLinks item={tribunal} />
        </article>
      </div>
    </section>
  );
}

type OfficialLinksProps = {
  item: ReturnType<typeof getLegalContent>;
};

function OfficialLinks({ item }: OfficialLinksProps) {
  if (item.sourceUrls.length === 0) {
    return null;
  }

  return (
    <nav className="official-link-list" aria-label={`Official sources for ${item.title}`}>
      {item.sourceUrls.map((url, index) => (
        <a
          key={url}
          href={url}
          rel="noreferrer"
          target="_blank"
          aria-label={`${item.sourceTitles?.[index] ?? "Official guidance"} (opens in a new tab)`}
        >
          {item.sourceTitles?.[index] ?? "Official guidance"}
        </a>
      ))}
    </nav>
  );
}

function stepsForContext(
  context: TenancyContext,
  evidenceMode: EvidenceMode
): string[] {
  const liveEvidenceStep =
    evidenceMode === "official-with-pmi-live"
      ? ["Compare the live asking-rent listings with evidence you collect yourself."]
      : [];

  if (context === "formal-form-4a-section-13") {
    return [
      "Keep a copy of the notice and any emails or messages about it.",
      "Check whether the notice identifies the proposed rent and uses the correct form.",
      ...liveEvidenceStep,
      "Check official guidance on notice periods and tribunal deadlines.",
      "Collect your own rental evidence before contacting the landlord, landlady or letting agent.",
      "Consider independent housing advice if the deadline or tenancy status is unclear."
    ];
  }

  if (context === "informal-proposed-increase") {
    return [
      "Ask how the proposed rent was calculated.",
      "Look for whether a formal Form 4A or section 13 notice has been served.",
      ...liveEvidenceStep,
      "Collect listings or other rental evidence for similar homes nearby.",
      "Check official guidance before assuming the tribunal route applies."
    ];
  }

  return [
    "Compare the official benchmark with evidence you collect yourself.",
    ...liveEvidenceStep,
    "Collect examples of similar properties in your area.",
    "Check official guidance if a rent increase is proposed later.",
    "Avoid missing any formal deadline if you receive a notice."
  ];
}
