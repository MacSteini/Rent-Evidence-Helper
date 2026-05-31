import { useEffect, useMemo, useState } from "react";
import { CopyableMessage } from "./CopyableMessage";
import { disputeSupportCopy } from "../content/uiCopy";
import {
  buildDisputeMessageTemplate,
  getAvailableDisputeTemplateIds,
  getDefaultDisputeSupportSelection
} from "../lib/disputeSupport";
import type {
  DisputeSupportSelection,
  DisputeTemplateId,
  DisputeTemplateOption
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
  const defaultSelection = useMemo(
    () => getDefaultDisputeSupportSelection(result),
    [result]
  );
  const [templateId, setTemplateId] = useState<DisputeTemplateId>(
    availableTemplates[0]
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

  function toggleOption(option: DisputeTemplateOption) {
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
          onChange={toggleOption}
        />
        {result.liveEvidence?.medianMonthly && (
          <OptionCheckbox
            option="includePmiLive"
            checked={selection.includePmiLive}
            onChange={toggleOption}
          />
        )}
        {result.deeperComparableEvidence?.medianMonthly && (
          <OptionCheckbox
            option="includePmiDeeper"
            checked={selection.includePmiDeeper}
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
  onChange: (option: DisputeTemplateOption) => void;
};

function OptionCheckbox({ option, checked, onChange }: OptionCheckboxProps) {
  return (
    <label className="checkbox-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(option)}
      />
      {disputeSupportCopy.options[option]}
    </label>
  );
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
