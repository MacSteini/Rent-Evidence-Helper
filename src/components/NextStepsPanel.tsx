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
    </section>
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
