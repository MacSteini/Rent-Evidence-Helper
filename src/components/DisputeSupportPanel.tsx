import { useEffect, useMemo, useState } from "react";
import { CopyableMessage } from "./CopyableMessage";
import { disputeSupportCopy } from "../content/uiCopy";
import {
  assessDisputeTemplateSuitability,
  buildDisputeMessageTemplate,
  getAdvisedDisputeSupportSelection,
  getAvailableDisputeTemplateIds,
  getDisputeEvidenceOptionAdvisories
} from "../lib/disputeSupport";
import type {
  DisputeEvidenceOptionAdvisory,
  DisputeSupportSelection,
  DisputeTemplateId,
  DisputeTemplateOption,
  DisputeTemplateSuitability
} from "../types/disputeSupport";
import type { RentCheckResult } from "../types/rentCheckResult";

type DisputeSupportPanelProps = {
  result: RentCheckResult;
};

export function DisputeSupportPanel({ result }: DisputeSupportPanelProps) {
  const availableTemplates = useMemo(
    () => getAvailableDisputeTemplateIds(result),
    [result]
  );
  const [templateId, setTemplateId] = useState<DisputeTemplateId>(
    availableTemplates[0]
  );
  const defaultSelection = useMemo(
    () => getAdvisedDisputeSupportSelection(result, templateId),
    [result, templateId]
  );
  const [selection, setSelection] =
    useState<DisputeSupportSelection>(defaultSelection);

  useEffect(() => {
    setTemplateId((currentTemplateId) =>
      availableTemplates.includes(currentTemplateId)
        ? currentTemplateId
        : availableTemplates[0]
    );
    setSelection(defaultSelection);
  }, [availableTemplates, defaultSelection]);

  const message = buildDisputeMessageTemplate(result, templateId, selection);
  const selectedTemplate = disputeSupportCopy.templates[templateId];
  const evidenceAdvisories = useMemo(
    () => getDisputeEvidenceOptionAdvisories(result),
    [result]
  );
  const templateSuitability = useMemo(
    () => assessDisputeTemplateSuitability(result, templateId),
    [result, templateId]
  );

  function toggleOption(option: DisputeTemplateOption) {
    if (isEvidenceOptionDisabled(option, evidenceAdvisories)) return;
    setSelection((current) => ({
      ...current,
      [option]: !current[option]
    }));
  }

  return (
    <section className="panel dispute-support-panel" aria-labelledby="dispute-support-title">
      <div className="section-heading">
        <h2 id="dispute-support-title">{disputeSupportCopy.title}</h2>
        <p>{disputeSupportCopy.summary}</p>
      </div>

      <div className="notice notice-compact">
        <p>{disputeSupportCopy.note}</p>
      </div>

      <div className="dispute-template-controls">
        <label className="field">
          <span>{disputeSupportCopy.templateLabel}</span>
          <select
            value={templateId}
            onChange={(event) =>
              setTemplateId(event.target.value as DisputeTemplateId)
            }
          >
            {availableTemplates.map((availableTemplateId) => (
              <option key={availableTemplateId} value={availableTemplateId}>
                {disputeSupportCopy.templates[availableTemplateId].title}
              </option>
            ))}
          </select>
        </label>
        <p>{selectedTemplate.summary}</p>
      </div>

      <fieldset className="fieldset dispute-options">
        <legend>{disputeSupportCopy.optionLegend}</legend>
        <OptionCheckbox
          option="includeOnsBenchmark"
          checked={selection.includeOnsBenchmark}
          advisory={findEvidenceAdvisory(evidenceAdvisories, "includeOnsBenchmark")}
          onChange={toggleOption}
        />
        {result.liveEvidence?.medianMonthly && (
          <OptionCheckbox
            option="includePmiLive"
            checked={selection.includePmiLive}
            advisory={findEvidenceAdvisory(evidenceAdvisories, "includePmiLive")}
            onChange={toggleOption}
          />
        )}
        {result.deeperComparableEvidence?.medianMonthly && (
          <OptionCheckbox
            option="includePmiDeeper"
            checked={selection.includePmiDeeper}
            advisory={findEvidenceAdvisory(evidenceAdvisories, "includePmiDeeper")}
            onChange={toggleOption}
          />
        )}
        <OptionCheckbox
          option="requestWrittenEvidence"
          checked={selection.requestWrittenEvidence}
          onChange={toggleOption}
        />
        <OptionCheckbox
          option="askForInformalResolution"
          checked={selection.askForInformalResolution}
          onChange={toggleOption}
        />
        {hasFormalNoticeDetails(result) && (
          <OptionCheckbox
            option="includeFormalNoticeDetails"
            checked={selection.includeFormalNoticeDetails}
            onChange={toggleOption}
          />
        )}
        <OptionCheckbox
          option="includeCaveat"
          checked={selection.includeCaveat}
          onChange={toggleOption}
        />
      </fieldset>

      <AdvisorNotice suitability={templateSuitability} />

      <CopyableMessage
        message={message}
        title={selectedTemplate.title}
        description={selectedTemplate.summary}
        textareaLabel={disputeSupportCopy.editableLabel}
        copyLabel={disputeSupportCopy.copyButton}
        copiedLabel={disputeSupportCopy.copiedButton}
        copyError={disputeSupportCopy.copyError}
        className="copyable-template"
        headingLevel="h3"
      />

      <section className="official-routes" aria-labelledby="official-routes-title">
        <div className="section-heading">
          <h3 id="official-routes-title">{disputeSupportCopy.officialRoutesTitle}</h3>
          <p>{disputeSupportCopy.officialRoutesSummary}</p>
        </div>
        <div className="guidance-grid">
          {disputeSupportCopy.officialRoutes.map((route) => (
            <article key={route.href}>
              <h4>{route.title}</h4>
              <p>{route.description}</p>
              <nav
                className="official-link-list"
                aria-label={`Official source for ${route.title}`}
              >
                <a
                  href={route.href}
                  rel="noreferrer"
                  target="_blank"
                  aria-label={`${route.label} (opens in a new tab)`}
                >
                  {route.label}
                </a>
              </nav>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

type OptionCheckboxProps = {
  option: DisputeTemplateOption;
  checked: boolean;
  advisory?: DisputeEvidenceOptionAdvisory;
  onChange: (option: DisputeTemplateOption) => void;
};

function OptionCheckbox({
  option,
  checked,
  advisory,
  onChange
}: OptionCheckboxProps) {
  const disabled = advisory?.allowed === false;
  return (
    <div className="dispute-option-row">
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={disabled ? false : checked}
          disabled={disabled}
          onChange={() => onChange(option)}
        />
        {disputeSupportCopy.options[option]}
      </label>
      {disabled && advisory && (
        <p className="option-advisory">
          {formatDisabledOptionReason(advisory.reason)}
        </p>
      )}
    </div>
  );
}

function formatDisabledOptionReason(reason: string): string {
  const trimmedReason = reason.trim();
  const weakenSuffix = ", so including it may weaken this message.";
  if (trimmedReason.endsWith(weakenSuffix)) {
    const evidenceReason = lowerFirst(trimmedReason.slice(0, -weakenSuffix.length));
    return `Left out because it may weaken this message: ${evidenceReason}.`;
  }

  const leftOutSuffix = ", so it is left out of this template.";
  if (trimmedReason.endsWith(leftOutSuffix)) {
    const evidenceReason = lowerFirst(trimmedReason.slice(0, -leftOutSuffix.length));
    return `Left out because ${evidenceReason}.`;
  }

  return `Left out: ${trimmedReason}`;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function AdvisorNotice({
  suitability
}: {
  suitability: DisputeTemplateSuitability;
}) {
  return (
    <section
      className={`advisor-notice advisor-notice-${suitability.status}`}
      aria-labelledby="advisor-note-title"
    >
      <div className="advisor-notice-header">
        <p className="label">{disputeSupportCopy.advisor.label}</p>
        <span className="status-badge">
          {disputeSupportCopy.advisor[suitability.status]}
        </span>
      </div>
      <h3 id="advisor-note-title">{suitability.title}</h3>
      <p>{suitability.summary}</p>
      {suitability.reasons.length > 0 && (
        <div>
          <h4>{disputeSupportCopy.advisor.reasonsTitle}</h4>
          <ul className="plain-list">
            {suitability.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h4>{disputeSupportCopy.advisor.recommendationTitle}</h4>
        <p>{suitability.recommendation}</p>
      </div>
    </section>
  );
}

function findEvidenceAdvisory(
  advisories: DisputeEvidenceOptionAdvisory[],
  option: DisputeEvidenceOptionAdvisory["option"]
): DisputeEvidenceOptionAdvisory | undefined {
  return advisories.find((advisory) => advisory.option === option);
}

function isEvidenceOptionDisabled(
  option: DisputeTemplateOption,
  advisories: DisputeEvidenceOptionAdvisory[]
): boolean {
  if (
    option !== "includeOnsBenchmark" &&
    option !== "includePmiLive" &&
    option !== "includePmiDeeper"
  ) {
    return false;
  }
  return findEvidenceAdvisory(advisories, option)?.allowed === false;
}

function hasFormalNoticeDetails(result: RentCheckResult): boolean {
  return Boolean(
    result.input.tenancyContext === "formal-form-4a-section-13" &&
      (result.input.noticeReceivedAt ||
        result.input.proposedIncreaseStartsAt ||
        result.input.noticeSaysForm4A ||
        result.input.noticeSaysSection13)
  );
}
