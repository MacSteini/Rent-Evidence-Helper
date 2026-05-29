import { getLegalContent } from "../content/legalGuidance";
import { resultCopy } from "../content/uiCopy";
import type { RentAssessmentStatus, TenancyContext } from "../types/rent";

type NextStepsPanelProps = {
  context: TenancyContext;
  status: RentAssessmentStatus;
};

export function NextStepsPanel({ context, status }: NextStepsPanelProps) {
  const steps = stepsForContext(context);
  const tribunal = getLegalContent("first-tier-tribunal");
  const form4a = getLegalContent("form-4a-section-13");

  return (
    <section className="panel" aria-labelledby="next-steps-title">
      <div className="section-heading">
        <p className="label">Next steps</p>
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

function stepsForContext(context: TenancyContext): string[] {
  if (context === "formal-form-4a-section-13") {
    return [
      "Keep a copy of the notice and any emails or messages about it.",
      "Check whether the notice identifies the proposed rent and uses the correct form.",
      "Check official guidance on notice periods and tribunal deadlines.",
      "Collect comparable evidence before contacting the landlord or letting agent.",
      "Consider independent housing advice if the deadline or tenancy status is unclear."
    ];
  }

  if (context === "informal-proposed-increase") {
    return [
      "Ask how the proposed rent was calculated.",
      "Look for whether a formal Form 4A or section 13 notice has been served.",
      "Collect comparable listings or other evidence for similar homes nearby.",
      "Check official guidance before assuming the tribunal route applies."
    ];
  }

  if (context === "not-sure") {
    return [
      "Check whether your landlord has served a formal notice.",
      "Keep copies of any letters, emails, text messages and rent records.",
      "Use official guidance to understand which process may apply.",
      "Seek independent advice if you are unsure about your tenancy type."
    ];
  }

  return [
    "Compare the result with evidence you collect yourself.",
    "Collect examples of similar properties in your area.",
    "Check official guidance if a rent increase is proposed later.",
    "Avoid missing any formal deadline if you receive a notice."
  ];
}
