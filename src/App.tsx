import { useEffect, useMemo, useRef, useState } from "react";
import { EvidenceTable } from "./components/EvidenceTable";
import { InfoDialog } from "./components/InfoDialog";
import { NextStepsPanel } from "./components/NextStepsPanel";
import { RentCheckForm } from "./components/RentCheckForm";
import { ResultSummary } from "./components/ResultSummary";
import { CopyableMessage } from "./components/CopyableMessage";
import { ThemeToggle } from "./components/ThemeToggle";
import { appConfig } from "./config/appConfig";
import { jurisdictionCopy, methodologyCopy, privacyCopy } from "./content/uiCopy";
import { assessRent, type AssessmentResult } from "./lib/assessment";
import { buildLandlordMessage } from "./lib/landlordMessage";
import { readStoredCheck, writeStoredCheck } from "./lib/persistedCheck";
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
  const [storedCheck] = useState(() => readStoredCheck());
  const [result, setResult] = useState<AssessmentResult | null>(
    storedCheck?.result ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasStartedCheck, setHasStartedCheck] = useState(Boolean(storedCheck));
  const [activeDialog, setActiveDialog] = useState<
    "methodology" | "privacy" | "scope" | null
  >(null);
  const resultSectionRef = useRef<HTMLElement>(null);

  const landlordMessage = useMemo(() => {
    if (!result) return "";
    return buildLandlordMessage(result.input, result.estimate);
  }, [result]);

  useEffect(() => {
    if (!result) return;

    requestAnimationFrame(() => {
      const resultSection = resultSectionRef.current;
      if (!resultSection) return;

      if (typeof resultSection.scrollIntoView === "function") {
        const prefersReducedMotion =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        resultSection.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      }
      resultSection.focus({ preventScroll: true });
    });
  }, [result]);

  async function handleSubmit(input: RentSearchInput) {
    setHasStartedCheck(true);
    setIsChecking(true);
    setError(null);
    try {
      const assessment = await assessRent(input, provider);
      setResult(assessment);
      writeStoredCheck(assessment.input, assessment);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "The rent check failed.");
    } finally {
      setIsChecking(false);
    }
  }

  function handleInvalidSubmit() {
    setHasStartedCheck(false);
    setResult(null);
    setError(null);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <a className="brand" href="./" aria-label={`${appConfig.productName} home`}>
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
          <a
            className="nav-link"
            href="https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases"
            aria-label="GOV.UK rent increase guidance (opens in a new tab)"
            rel="noreferrer"
            target="_blank"
          >
            GOV.UK guidance
          </a>
          <ThemeToggle />
        </nav>
      </header>

      <main id="main-content">
        <section className="intro-band" aria-labelledby="page-title">
          <div>
            <h1 id="page-title">Check your rent against local market evidence</h1>
            <p>
              Enter your rent and property details to see how your rent compares
              with similar homes nearby. This tool is for rental properties in
              England and gives general information, not legal advice.
            </p>
            <aside className="jurisdiction-note" aria-label="Scope and legal note">
              <strong>{jurisdictionCopy.intro}</strong>
              <span>{jurisdictionCopy.disclaimer}</span>
              <button
                type="button"
                className="scope-link"
                onClick={() => setActiveDialog("scope")}
              >
                Why this scope?
              </button>
            </aside>
          </div>
        </section>

        <div
          className={
            hasStartedCheck
              ? "workspace-grid workspace-grid-has-result"
              : "workspace-grid workspace-grid-single"
          }
        >
          {hasStartedCheck && (
            <section
              ref={resultSectionRef}
              className="result-region"
              aria-live="polite"
              aria-label="Rent check result"
              tabIndex={-1}
            >
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
                  <h2>{isChecking ? "Checking your rent" : "No result available"}</h2>
                  <p>
                    {isChecking
                      ? "The result will appear here when the comparison is ready."
                      : "Check the form and try again."}
                  </p>
                </div>
              )}
            </section>
          )}

          <RentCheckForm
            initialInput={storedCheck?.input ?? initialInput}
            isChecking={isChecking}
            error={error}
            onInvalidSubmit={handleInvalidSubmit}
            onSubmit={handleSubmit}
          />
        </div>
      </main>

      <InfoDialog
        isOpen={activeDialog === "methodology"}
        title="How this works"
        onClose={() => setActiveDialog(null)}
      >
        <div className="method-list">
          {methodologyCopy.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </InfoDialog>

      <InfoDialog
        isOpen={activeDialog === "privacy"}
        title="Privacy and data use"
        onClose={() => setActiveDialog(null)}
      >
        <p>{privacyCopy}</p>
        <p>{jurisdictionCopy.privacy}</p>
      </InfoDialog>

      <InfoDialog
        isOpen={activeDialog === "scope"}
        title={jurisdictionCopy.scopeTitle}
        onClose={() => setActiveDialog(null)}
      >
        <p>{jurisdictionCopy.scopeSummary}</p>
        <div className="scope-point-list">
          {jurisdictionCopy.scopePoints.map((point) => (
            <p key={point}>{point}</p>
          ))}
        </div>
        <p>{jurisdictionCopy.scopeSourceIntro}</p>
        <nav className="official-source-links" aria-label="Official scope sources">
          <a
            href="https://www.gov.uk/government/publications/the-renters-rights-act-information-sheet-2026"
            aria-label="GOV.UK Renters' Rights Act information sheet (opens in a new tab)"
            rel="noreferrer"
            target="_blank"
          >
            GOV.UK Renters' Rights Act information sheet
          </a>
          <a
            href="https://rentsmart.gov.wales/en/rentersrights/"
            aria-label="Rent Smart Wales: Renters' Rights Act (opens in a new tab)"
            rel="noreferrer"
            target="_blank"
          >
            Rent Smart Wales: Renters' Rights Act
          </a>
          <a
            href="https://www.gov.scot/publications/rental-discrimination-guidance-for-scotland/"
            aria-label="Scottish Government rental discrimination guidance (opens in a new tab)"
            rel="noreferrer"
            target="_blank"
          >
            Scottish Government rental discrimination guidance
          </a>
        </nav>
      </InfoDialog>

      <footer className="site-footer">
        <span>{appConfig.productName}</span>
        <span>England market-rent comparison</span>
      </footer>
    </div>
  );
}
