import { useMemo, useState } from "react";
import { Disclaimer } from "./components/Disclaimer";
import { EvidenceTable } from "./components/EvidenceTable";
import { InfoDialog } from "./components/InfoDialog";
import { NextStepsPanel } from "./components/NextStepsPanel";
import { RentCheckForm } from "./components/RentCheckForm";
import { ResultSummary } from "./components/ResultSummary";
import { CopyableMessage } from "./components/CopyableMessage";
import { appConfig } from "./config/appConfig";
import { getLegalContent } from "./content/legalGuidance";
import { methodologyCopy, privacyCopy } from "./content/uiCopy";
import { assessRent, type AssessmentResult } from "./lib/assessment";
import { buildLandlordMessage } from "./lib/landlordMessage";
import { MockComparableRentProvider } from "./providers/MockComparableRentProvider";
import type { RentSearchInput } from "./types/rent";

const provider = new MockComparableRentProvider();

const initialInput: RentSearchInput = {
  postcode: "SW12 8AA",
  rentAmount: 2450,
  rentPeriod: "month",
  propertyType: "flat",
  bedrooms: 2,
  bathrooms: 1,
  furnished: "unknown",
  billsIncluded: "unknown",
  condition: "unknown",
  tenancyContext: "informal-proposed-increase"
};

export default function App() {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [activeDialog, setActiveDialog] = useState<"methodology" | "privacy" | null>(
    null
  );

  const landlordMessage = useMemo(() => {
    if (!result) return "";
    return buildLandlordMessage(result.input, result.estimate);
  }, [result]);

  async function handleSubmit(input: RentSearchInput) {
    setIsChecking(true);
    setError(null);
    try {
      const assessment = await assessRent(input, provider);
      setResult(assessment);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "The rent check failed.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label={`${appConfig.productName} home`}>
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>{appConfig.productName}</span>
        </a>
        <nav aria-label="Primary">
          <button
            type="button"
            className="nav-button"
            onClick={() => setActiveDialog("methodology")}
          >
            How this works
          </button>
          <button
            type="button"
            className="nav-button"
            onClick={() => setActiveDialog("privacy")}
          >
            Privacy
          </button>
          <a href="https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases">
            GOV.UK guidance
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="intro-band" aria-labelledby="page-title">
          <div>
            <h1 id="page-title">Check your rent against local market evidence</h1>
            <p>
              Enter your rent and property details to see how your rent compares
              with similar homes nearby. This tool gives general information,
              not legal advice.
            </p>
          </div>
          <Disclaimer item={getLegalContent("general-disclaimer")} compact />
        </section>

        <div className="workspace-grid">
          <RentCheckForm
            initialInput={initialInput}
            isChecking={isChecking}
            error={error}
            onSubmit={handleSubmit}
          />

          <section aria-live="polite" aria-label="Rent check result">
            {result ? (
              <div className="result-stack">
                <ResultSummary result={result} />
                <EvidenceTable
                  comparables={result.searchResult.comparables}
                  searchAreaDescription={result.searchResult.searchAreaDescription}
                />
                <NextStepsPanel
                  context={result.input.tenancyContext}
                  status={result.estimate.status}
                />
                <CopyableMessage message={landlordMessage} />
              </div>
            ) : (
              <div className="empty-state">
                <h2>Your result will appear here</h2>
                <p>
                  The first result uses fixture data so you can inspect the
                  workflow before any live data provider is selected.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <InfoDialog
        isOpen={activeDialog === "methodology"}
        title="How this works"
        onClose={() => setActiveDialog(null)}
      >
        <ol className="method-list">
          {methodologyCopy.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </InfoDialog>

      <InfoDialog
        isOpen={activeDialog === "privacy"}
        title="Privacy and data use"
        onClose={() => setActiveDialog(null)}
      >
        <p>{privacyCopy}</p>
      </InfoDialog>

      <footer className="site-footer">
        <span>{appConfig.productName}</span>
        <span>Prototype using fixture data only</span>
      </footer>
    </div>
  );
}
