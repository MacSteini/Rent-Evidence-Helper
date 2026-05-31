import { useEffect, useRef, useState } from "react";
import { DeeperComparablePanel } from "./components/DeeperComparablePanel";
import { DisputeSupportPanel } from "./components/DisputeSupportPanel";
import { EvidenceSummaryPanel } from "./components/EvidenceSummaryPanel";
import { InfoDialog } from "./components/InfoDialog";
import { LiveEvidencePanel } from "./components/LiveEvidencePanel";
import { NextStepsPanel } from "./components/NextStepsPanel";
import { OfficialBenchmarkPanel } from "./components/OfficialBenchmarkPanel";
import { RentCheckForm } from "./components/RentCheckForm";
import { ResultSummary } from "./components/ResultSummary";
import { ThemeToggle } from "./components/ThemeToggle";
import { appConfig } from "./config/appConfig";
import { jurisdictionCopy, methodologyCopy, privacyCopy } from "./content/uiCopy";
import officialBenchmarkDatasetJson from "./data/official-rent-benchmarks.json";
import {
  compareRentWithOfficialBenchmark,
  findOfficialBenchmarkByAreaCode,
  listOfficialBenchmarkAreas,
  validateOfficialRentBenchmarkDataset
} from "./lib/officialRentBenchmarks";
import { readStoredCheck, writeStoredCheck } from "./lib/persistedCheck";
import {
  clearStoredPmiApiKey,
  readStoredPmiApiKey,
  writeStoredPmiApiKey
} from "./lib/pmiApiKey";
import {
  buildPmiCooldownMessage,
  getPmiCooldownSeconds
} from "./lib/pmiRequestPacing";
import {
  deeperComparableErrorMessage,
  liveEvidenceErrorMessage,
  searchPmiDeeperComparables,
  searchPmiLiveRentalListings
} from "./providers/propertyMarketIntelProvider";
import type { OfficialRentBenchmarkDataset } from "./types/officialRentBenchmark";
import type { RentCheckResult } from "./types/rentCheckResult";
import type { RentSearchInput } from "./types/rent";

const officialBenchmarkDataset =
  officialBenchmarkDatasetJson as OfficialRentBenchmarkDataset;
validateOfficialRentBenchmarkDataset(officialBenchmarkDataset);
const localAuthorityOptions = listOfficialBenchmarkAreas(officialBenchmarkDataset);

const initialInput: RentSearchInput = {
  postcode: "SW12 8AA",
  localAuthorityCode: "",
  rentAmount: 2450,
  rentPeriod: "month",
  propertyType: "unknown",
  bedrooms: 1,
  bathrooms: 1,
  furnished: "unknown",
  billsIncluded: "unknown",
  condition: "unknown",
  tenancyContext: "current-rent-only"
};

export default function App() {
  const [storedCheck] = useState(() =>
    readStoredCheck(officialBenchmarkDataset.sourceSha256)
  );
  const [storedPmiKey] = useState(() => readStoredPmiApiKey());
  const [pmiApiKey, setPmiApiKey] = useState(storedPmiKey.key);
  const [rememberPmiApiKey, setRememberPmiApiKey] = useState(
    storedPmiKey.remember
  );
  const [result, setResult] = useState<RentCheckResult | null>(
    storedCheck
      ? {
          input: storedCheck.input,
          officialBenchmarkComparison: storedCheck.officialBenchmarkComparison,
          liveEvidence: storedCheck.liveEvidence,
          deeperComparableEvidence: storedCheck.deeperComparableEvidence,
          warnings: storedCheck.warnings,
          evidenceMode: storedCheck.evidenceMode
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRunningDeeperCheck, setIsRunningDeeperCheck] = useState(false);
  const [deeperComparableError, setDeeperComparableError] = useState<string | null>(
    null
  );
  const [lastPmiAttemptAt, setLastPmiAttemptAt] = useState<number | null>(null);
  const [, setPmiCooldownTick] = useState(0);
  const [hasStartedCheck, setHasStartedCheck] = useState(Boolean(storedCheck));
  const [activeDialog, setActiveDialog] = useState<
    "methodology" | "privacy" | "scope" | null
  >(null);
  const resultSectionRef = useRef<HTMLElement>(null);
  const pmiCooldownSeconds = getPmiCooldownSeconds(lastPmiAttemptAt);

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

  useEffect(() => {
    if (pmiCooldownSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setPmiCooldownTick((tick) => tick + 1);
    }, 250);

    return () => window.clearInterval(timer);
  }, [pmiCooldownSeconds]);

  function markPmiAttempt() {
    setLastPmiAttemptAt(Date.now());
  }

  async function handleSubmit(input: RentSearchInput) {
    setHasStartedCheck(true);
    setIsChecking(true);
    setError(null);
    setDeeperComparableError(null);
    setResult(null);
    try {
      const benchmark = findOfficialBenchmarkByAreaCode(
        officialBenchmarkDataset,
        input.localAuthorityCode
      );

      if (!benchmark) {
        throw new Error("Select a valid Local Authority from the list.");
      }

      const officialBenchmarkComparison = compareRentWithOfficialBenchmark(
        input,
        benchmark
      );
      const warnings: string[] = [];
      let liveEvidence;

      if (pmiApiKey.trim()) {
        const cooldownSeconds = getPmiCooldownSeconds(lastPmiAttemptAt);
        if (cooldownSeconds > 0) {
          warnings.push(buildPmiCooldownMessage(cooldownSeconds));
        } else {
          try {
            markPmiAttempt();
            liveEvidence = await searchPmiLiveRentalListings(input, pmiApiKey);
          } catch (liveEvidenceError) {
            warnings.push(liveEvidenceErrorMessage(liveEvidenceError));
          }
        }
      }

      const nextResult: RentCheckResult = {
        input,
        officialBenchmarkComparison,
        liveEvidence,
        warnings,
        evidenceMode: liveEvidence
          ? "official-with-pmi-live"
          : warnings.length > 0
            ? "official-with-pmi-warning"
            : "official-only"
      };

      setResult(nextResult);
      writeStoredCheck(
        nextResult.input,
        nextResult.officialBenchmarkComparison,
        {
          liveEvidence: nextResult.liveEvidence,
          deeperComparableEvidence: nextResult.deeperComparableEvidence,
          warnings: nextResult.warnings,
          evidenceMode: nextResult.evidenceMode
        },
        officialBenchmarkDataset.sourceSha256
      );
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
    setDeeperComparableError(null);
  }

  function handleInputChange() {
    setHasStartedCheck(false);
    setResult(null);
    setError(null);
    setDeeperComparableError(null);
  }

  function handlePmiApiKeyChange(nextKey: string) {
    setPmiApiKey(nextKey);
    writeStoredPmiApiKey(nextKey, rememberPmiApiKey);
    handleInputChange();
  }

  function handlePmiRememberChange(remember: boolean) {
    setRememberPmiApiKey(remember);
    writeStoredPmiApiKey(pmiApiKey, remember);
  }

  function handleClearPmiApiKey() {
    setPmiApiKey("");
    setRememberPmiApiKey(false);
    clearStoredPmiApiKey();
    handleInputChange();
  }

  async function handleRunDeeperComparables() {
    if (!result) return;

    const cooldownSeconds = getPmiCooldownSeconds(lastPmiAttemptAt);
    if (cooldownSeconds > 0) {
      setDeeperComparableError(buildPmiCooldownMessage(cooldownSeconds));
      return;
    }

    setIsRunningDeeperCheck(true);
    setDeeperComparableError(null);
    try {
      markPmiAttempt();
      const deeperComparableEvidence = await searchPmiDeeperComparables(
        result.input,
        pmiApiKey
      );
      const nextResult: RentCheckResult = {
        ...result,
        deeperComparableEvidence
      };

      setResult(nextResult);
      writeStoredCheck(
        nextResult.input,
        nextResult.officialBenchmarkComparison,
        {
          liveEvidence: nextResult.liveEvidence,
          deeperComparableEvidence: nextResult.deeperComparableEvidence,
          warnings: nextResult.warnings,
          evidenceMode: nextResult.evidenceMode
        },
        officialBenchmarkDataset.sourceSha256
      );
    } catch (caught) {
      setDeeperComparableError(deeperComparableErrorMessage(caught));
    } finally {
      setIsRunningDeeperCheck(false);
    }
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
            <h1 id="page-title">Check your rent against the ONS area benchmark</h1>
            <p>
              Compare your rent with the Office for National Statistics (ONS)
              monthly private rent estimate for your selected Local Authority,
              then prepare a calm evidence request if you need one.
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
                  <EvidenceSummaryPanel result={result} />
                  <OfficialBenchmarkPanel
                    comparison={result.officialBenchmarkComparison}
                    sourceUrl={officialBenchmarkDataset.sourceUrl}
                    releaseDate={officialBenchmarkDataset.releaseDate}
                    period={officialBenchmarkDataset.period}
                  />
                  {result.liveEvidence && (
                    <LiveEvidencePanel
                      evidence={result.liveEvidence}
                      userRentMonthly={
                        result.officialBenchmarkComparison.userRentMonthly
                      }
                    />
                  )}
                  {(pmiApiKey.trim() || result.deeperComparableEvidence) && (
                    <DeeperComparablePanel
                      input={result.input}
                      evidence={result.deeperComparableEvidence}
                      hasLiveEvidence={Boolean(result.liveEvidence)}
                      canRun={Boolean(pmiApiKey.trim()) && pmiCooldownSeconds === 0}
                      cooldownSeconds={
                        pmiApiKey.trim() && pmiCooldownSeconds > 0
                          ? pmiCooldownSeconds
                          : 0
                      }
                      isRunning={isRunningDeeperCheck}
                      error={deeperComparableError}
                      onRun={handleRunDeeperComparables}
                    />
                  )}
                  {result.warnings.length > 0 && (
                    <div className="notice notice-compact" role="status">
                      {result.warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  )}
                  <NextStepsPanel
                    context={result.input.tenancyContext}
                    status={result.officialBenchmarkComparison.status}
                    evidenceMode={result.evidenceMode}
                  />
                  <DisputeSupportPanel result={result} />
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
            localAuthorityOptions={localAuthorityOptions}
            pmiApiKey={pmiApiKey}
            rememberPmiApiKey={rememberPmiApiKey}
            isChecking={isChecking}
            error={error}
            onPmiApiKeyChange={handlePmiApiKeyChange}
            onPmiRememberChange={handlePmiRememberChange}
            onClearPmiApiKey={handleClearPmiApiKey}
            onInputChange={handleInputChange}
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
        <span>England rent benchmark and dispute support</span>
      </footer>
    </div>
  );
}
