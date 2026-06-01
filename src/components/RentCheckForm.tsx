import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ApiKeyPanel } from "./ApiKeyPanel";
import { InfoButton } from "./InfoButton";
import { fieldCopy, fieldHelpCopy } from "../content/uiCopy";
import {
  evaluateSubmitAttempt,
  initialSubmitGuardState,
  inputLimits,
  parseRentAmountInput,
  sanitiseRentAmountInput,
  sanitisePostcodeInput
} from "../lib/inputHardening";
import { isSupportedEnglandPostcode, isValidPostcode } from "../lib/postcode";
import type {
  FurnishedStatus,
  PropertyCondition,
  PropertyType,
  RentPeriod,
  RentSearchInput,
  TenancyContext
} from "../types/rent";

type LocalAuthorityOption = {
  areaCode: string;
  areaName: string;
  regionOrCountryName: string;
};

type RentCheckFormProps = {
  initialInput: RentSearchInput;
  resetKey?: number;
  localAuthorityOptions: LocalAuthorityOption[];
  pmiApiKey: string;
  rememberPmiApiKey: boolean;
  isChecking: boolean;
  error: string | null;
  onPmiApiKeyChange: (apiKey: string) => void;
  onPmiRememberChange: (remember: boolean) => void;
  onClearPmiApiKey: () => void;
  onInputChange: () => void;
  onInvalidSubmit: () => void;
  onSubmit: (input: RentSearchInput) => void;
};

type FormErrors = Partial<Record<keyof RentSearchInput, string>>;

function formatInitialRentAmount(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

export function RentCheckForm({
  initialInput,
  resetKey = 0,
  localAuthorityOptions,
  pmiApiKey,
  rememberPmiApiKey,
  isChecking,
  error,
  onPmiApiKeyChange,
  onPmiRememberChange,
  onClearPmiApiKey,
  onInputChange,
  onInvalidSubmit,
  onSubmit
}: RentCheckFormProps) {
  const [input, setInput] = useState<RentSearchInput>(initialInput);
  const [rentAmountText, setRentAmountText] = useState(
    formatInitialRentAmount(initialInput.rentAmount)
  );
  const [currentRentBeforeIncreaseText, setCurrentRentBeforeIncreaseText] =
    useState(
      initialInput.currentRentBeforeIncrease
        ? String(initialInput.currentRentBeforeIncrease)
        : ""
    );
  const [localAuthorityText, setLocalAuthorityText] = useState(() =>
    getLocalAuthorityLabel(initialInput.localAuthorityCode, localAuthorityOptions)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitGuardMessage, setSubmitGuardMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitGuardRef = useRef(initialSubmitGuardState);

  useEffect(() => {
    setInput(initialInput);
    setRentAmountText(formatInitialRentAmount(initialInput.rentAmount));
    setCurrentRentBeforeIncreaseText(
      initialInput.currentRentBeforeIncrease
        ? String(initialInput.currentRentBeforeIncrease)
        : ""
    );
    setLocalAuthorityText(
      getLocalAuthorityLabel(initialInput.localAuthorityCode, localAuthorityOptions)
    );
    setErrors({});
    setSubmitGuardMessage(null);
    submitGuardRef.current = initialSubmitGuardState;
  }, [initialInput, localAuthorityOptions, resetKey]);

  function update<K extends keyof RentSearchInput>(key: K, value: RentSearchInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
    onInputChange();
  }

  function updateRentAmount(value: string) {
    const sanitisedValue = sanitiseRentAmountInput(value);
    setRentAmountText(sanitisedValue);
    update("rentAmount", parseRentAmountInput(sanitisedValue));
  }

  function updateCurrentRentBeforeIncrease(value: string) {
    const sanitisedValue = sanitiseRentAmountInput(value);
    const parsedValue = parseRentAmountInput(sanitisedValue);
    setCurrentRentBeforeIncreaseText(sanitisedValue);
    update(
      "currentRentBeforeIncrease",
      Number.isFinite(parsedValue) ? parsedValue : undefined
    );
  }

  function updateTenancyContext(value: TenancyContext) {
    if (value === "current-rent-only") {
      setCurrentRentBeforeIncreaseText("");
      setInput((current) => ({
        ...current,
        tenancyContext: value,
        currentRentBeforeIncrease: undefined
      }));
      onInputChange();
      return;
    }

    update("tenancyContext", value);
  }

  function updateLocalAuthority(value: string) {
    const selectedOption = findLocalAuthorityOption(value, localAuthorityOptions);
    setLocalAuthorityText(value);
    setInput((current) => ({
      ...current,
      localAuthorityCode: selectedOption?.areaCode ?? ""
    }));
    onInputChange();
  }

  function normaliseLocalAuthority() {
    const selectedOption = findLocalAuthorityOption(
      localAuthorityText,
      localAuthorityOptions
    );
    if (selectedOption) {
      setLocalAuthorityText(formatLocalAuthorityOption(selectedOption));
    }
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!isValidPostcode(input.postcode)) {
      nextErrors.postcode = "Enter a valid UK postcode.";
    } else if (!isSupportedEnglandPostcode(input.postcode)) {
      nextErrors.postcode =
        "This postcode area is outside the England scope this check supports.";
    }
    if (
      !input.localAuthorityCode ||
      !localAuthorityOptions.some(
        (option) => option.areaCode === input.localAuthorityCode
      )
    ) {
      nextErrors.localAuthorityCode = "Select the rental property’s Local Authority.";
    }
    if (!Number.isFinite(input.rentAmount) || input.rentAmount <= 0) {
      nextErrors.rentAmount = "Enter a rent amount greater than zero.";
    }
    if (input.rentAmount > 50_000) {
      nextErrors.rentAmount = "Enter a monthly-equivalent rent below £50,000.";
    }
    if (
      input.tenancyContext !== "current-rent-only" &&
      currentRentBeforeIncreaseText.trim() !== ""
    ) {
      if (
        !Number.isFinite(input.currentRentBeforeIncrease) ||
        input.currentRentBeforeIncrease === undefined ||
        input.currentRentBeforeIncrease <= 0
      ) {
        nextErrors.currentRentBeforeIncrease =
          "Enter a current rent greater than zero.";
      } else if (input.currentRentBeforeIncrease >= input.rentAmount) {
        nextErrors.currentRentBeforeIncrease =
          "Enter a current rent below the proposed new rent, or change the situation.";
      }
    }
    if (input.bedrooms < 0 || input.bedrooms > 10) {
      nextErrors.bedrooms = "Enter a bedroom count between 0 and 10.";
    }
    if (
      input.bathrooms !== undefined &&
      (input.bathrooms < 0 || input.bathrooms > 10)
    ) {
      nextErrors.bathrooms = "Enter a bathroom count between 0 and 10.";
    }
    if (!isValidOptionalDate(input.noticeReceivedAt)) {
      nextErrors.noticeReceivedAt = "Enter a valid notice received date.";
    }
    if (!isValidOptionalDate(input.proposedIncreaseStartsAt)) {
      nextErrors.proposedIncreaseStartsAt =
        "Enter a valid proposed increase start date.";
    }
    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitGuardMessage(null);
      onInvalidSubmit();
      requestAnimationFrame(() => {
        const firstInvalid = formRef.current?.querySelector<HTMLElement>(
          "[aria-invalid='true']"
        );
        firstInvalid?.focus();
      });
      return;
    }

    const submitAttempt = evaluateSubmitAttempt(submitGuardRef.current);
    submitGuardRef.current = submitAttempt.state;

    if (!submitAttempt.allowed) {
      setSubmitGuardMessage(submitAttempt.message);
      onInvalidSubmit();
      return;
    }

    setSubmitGuardMessage(null);
    onSubmit(input);
  }

  const isIncreaseContext = input.tenancyContext !== "current-rent-only";

  return (
    <form
      ref={formRef}
      className="form-panel"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="section-heading">
        <h2>Rent check details</h2>
      </div>

      <ApiKeyPanel
        apiKey={pmiApiKey}
        rememberApiKey={rememberPmiApiKey}
        onApiKeyChange={onPmiApiKeyChange}
        onRememberChange={onPmiRememberChange}
        onClear={onClearPmiApiKey}
      />

      {error && <p className="form-error" role="alert">{error}</p>}
      {submitGuardMessage && (
        <p className="form-error" role="alert">
          {submitGuardMessage}
        </p>
      )}

      <div className="field-grid">
        <TextField
          label="Postcode"
          value={input.postcode}
          required
          hint={fieldCopy.postcodeHint}
          error={errors.postcode}
          maxLength={inputLimits.postcodeMaxLength}
          autoComplete="postal-code"
          inputMode="text"
          pattern="[A-Za-z0-9 ]{5,8}"
          onChange={(value) => update("postcode", sanitisePostcodeInput(value))}
        />
        <LocalAuthorityField
          label="Local authority"
          help={fieldHelpCopy.localAuthority}
          value={localAuthorityText}
          required
          hint={fieldCopy.localAuthorityHint}
          error={errors.localAuthorityCode}
          options={localAuthorityOptions}
          onChange={updateLocalAuthority}
          onBlur={normaliseLocalAuthority}
        />
      </div>

      <div className="field-grid">
        <TextField
          label={isIncreaseContext ? "Proposed new rent" : "Current rent"}
          value={rentAmountText}
          required
          hint={
            isIncreaseContext
              ? fieldCopy.proposedRentHint
              : fieldCopy.currentRentHint
          }
          error={errors.rentAmount}
          maxLength={10}
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]{0,2}"
          onChange={updateRentAmount}
        />
        <SelectField
          label="Rent period"
          value={input.rentPeriod}
          options={[
            ["week", "Weekly"],
            ["month", "Monthly"],
            ["year", "Yearly"]
          ]}
          onChange={(value) => update("rentPeriod", value as RentPeriod)}
        />
      </div>

      {isIncreaseContext && (
        <TextField
          label="Current rent before increase"
          value={currentRentBeforeIncreaseText}
          hint={fieldCopy.currentRentBeforeIncreaseHint}
          error={errors.currentRentBeforeIncrease}
          maxLength={10}
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]{0,2}"
          onChange={updateCurrentRentBeforeIncrease}
        />
      )}

      <div className="field-grid">
        <SelectField
          label="Property type"
          value={input.propertyType}
          options={[
            ["flat", "Flat"],
            ["house", "House"],
            ["studio", "Studio"],
            ["room", "Room"],
            ["maisonette", "Maisonette"],
            ["other", "Other"],
            ["unknown", "Unknown"]
          ]}
          onChange={(value) => update("propertyType", value as PropertyType)}
        />
        <NumberField
          label="Bedrooms"
          value={input.bedrooms}
          error={errors.bedrooms}
          min={inputLimits.bedroomMin}
          max={inputLimits.bedroomMax}
          inputMode="numeric"
          onChange={(value) => update("bedrooms", value)}
        />
      </div>

      <div className="field-grid">
        <NumberField
          label="Bathrooms"
          value={input.bathrooms ?? 1}
          error={errors.bathrooms}
          min={inputLimits.bathroomMin}
          max={inputLimits.bathroomMax}
          inputMode="numeric"
          onChange={(value) => update("bathrooms", value)}
        />
        <SelectField
          label="Furnished"
          value={input.furnished ?? "unknown"}
          options={[
            ["unknown", "Unknown"],
            ["furnished", "Furnished"],
            ["part-furnished", "Part-furnished"],
            ["unfurnished", "Unfurnished"]
          ]}
          onChange={(value) => update("furnished", value as FurnishedStatus)}
        />
      </div>

      <div className="field-grid">
        <SelectField
          label="Bills included"
          help={fieldHelpCopy.billsIncluded}
          value={String(input.billsIncluded ?? "unknown")}
          options={[
            ["unknown", "Unknown"],
            ["true", "Yes"],
            ["false", "No"]
          ]}
          onChange={(value) =>
            update(
              "billsIncluded",
              value === "unknown" ? "unknown" : value === "true"
            )
          }
        />
        <SelectField
          label="Condition"
          help={fieldHelpCopy.condition}
          value={input.condition ?? "unknown"}
          options={[
            ["unknown", "Unknown"],
            ["basic", "Basic"],
            ["average", "Average"],
            ["good", "Good"],
            ["newly-renovated", "Newly renovated"]
          ]}
          onChange={(value) => update("condition", value as PropertyCondition)}
        />
      </div>

      <div className="field-grid">
        <SelectField
          label="Situation"
          help={fieldHelpCopy.tenancyContext}
          value={input.tenancyContext}
          options={[
            ["current-rent-only", "Current rent only"],
            ["informal-proposed-increase", "Landlord proposed an increase informally"],
            ["formal-form-4a-section-13", "Form 4A / section 13 notice"]
          ]}
          onChange={(value) => updateTenancyContext(value as TenancyContext)}
        />
      </div>

      {input.tenancyContext === "formal-form-4a-section-13" && (
        <fieldset className="fieldset">
          <legend>Optional notice questions</legend>
          <TextField
            label="Date notice was received"
            type="date"
            value={input.noticeReceivedAt ?? ""}
            error={errors.noticeReceivedAt}
            min={inputLimits.dateMin}
            max={inputLimits.dateMax}
            onChange={(value) => update("noticeReceivedAt", value)}
          />
          <TextField
            label="Date proposed increase would start"
            type="date"
            value={input.proposedIncreaseStartsAt ?? ""}
            error={errors.proposedIncreaseStartsAt}
            min={inputLimits.dateMin}
            max={inputLimits.dateMax}
            onChange={(value) => update("proposedIncreaseStartsAt", value)}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(input.noticeSaysForm4A)}
              onChange={(event) => update("noticeSaysForm4A", event.target.checked)}
            />
            Notice says Form 4A
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(input.noticeSaysSection13)}
              onChange={(event) => update("noticeSaysSection13", event.target.checked)}
            />
            Notice says section 13
          </label>
        </fieldset>
      )}

      <button className="primary-button" type="submit" disabled={isChecking}>
        {isChecking ? "Checking rent..." : "Start check"}
      </button>
    </form>
  );
}

function formatLocalAuthorityOption(option: LocalAuthorityOption): string {
  return `${option.areaName} (${option.regionOrCountryName})`;
}

function findLocalAuthorityOption(
  value: string,
  options: LocalAuthorityOption[]
): LocalAuthorityOption | undefined {
  const normalisedValue = value.trim().toLowerCase();
  return options.find(
    (option) =>
      formatLocalAuthorityOption(option).toLowerCase() === normalisedValue ||
      option.areaName.toLowerCase() === normalisedValue ||
      option.areaCode.toLowerCase() === normalisedValue
  );
}

function getLocalAuthorityLabel(
  areaCode: string,
  options: LocalAuthorityOption[]
): string {
  const selectedOption = options.find((option) => option.areaCode === areaCode);
  return selectedOption ? formatLocalAuthorityOption(selectedOption) : "";
}

type TextFieldProps = {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  maxLength?: number;
  min?: string;
  max?: string;
  autoComplete?: string;
  inputMode?: "decimal" | "email" | "numeric" | "search" | "tel" | "text" | "url";
  pattern?: string;
  onChange: (value: string) => void;
};

function isValidOptionalDate(value: string | undefined): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return value >= inputLimits.dateMin && value <= inputLimits.dateMax;
}

function TextField({
  label,
  value,
  type = "text",
  required,
  hint,
  error,
  maxLength,
  min,
  max,
  autoComplete,
  inputMode,
  pattern,
  onChange
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {required && <RequiredIndicator />}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        min={min}
        max={max}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        aria-describedby={[hint ? hintId : "", error ? errorId : ""]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <p id={hintId} className="hint">{hint}</p>}
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  required?: boolean;
  hint?: string;
  error?: string;
  min?: number;
  max?: number;
  inputMode?: "decimal" | "numeric";
  onChange: (value: number) => void;
};

function NumberField({
  label,
  value,
  required,
  hint,
  error,
  min = 0,
  max,
  inputMode,
  onChange
}: NumberFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {required && <RequiredIndicator />}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step="1"
        value={value}
        required={required}
        inputMode={inputMode}
        aria-describedby={[hint ? hintId : "", error ? errorId : ""]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint && <p id={hintId} className="hint">{hint}</p>}
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  help?: string;
  value: string;
  required?: boolean;
  hint?: string;
  error?: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
};

function SelectField({
  label,
  help,
  value,
  required,
  hint,
  error,
  options,
  onChange
}: SelectFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <div className="label-row">
        <label htmlFor={id}>
          {label} {required && <RequiredIndicator />}
        </label>
        {help && <InfoButton label={label}>{help}</InfoButton>}
      </div>
      <select
        id={id}
        value={value}
        required={required}
        aria-describedby={[hint ? hintId : "", error ? errorId : ""]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
      {hint && <p id={hintId} className="hint">{hint}</p>}
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}

type LocalAuthorityFieldProps = {
  label: string;
  help?: string;
  value: string;
  required?: boolean;
  hint?: string;
  error?: string;
  options: LocalAuthorityOption[];
  onChange: (value: string) => void;
  onBlur: () => void;
};

function LocalAuthorityField({
  label,
  help,
  value,
  required,
  hint,
  error,
  options,
  onChange,
  onBlur
}: LocalAuthorityFieldProps) {
  const id = useId();
  const listId = `${id}-options`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <div className="label-row">
        <label htmlFor={id}>
          {label} {required && <RequiredIndicator />}
        </label>
        {help && <InfoButton label={label}>{help}</InfoButton>}
      </div>
      <input
        id={id}
        type="search"
        list={listId}
        value={value}
        required={required}
        autoComplete="off"
        inputMode="search"
        aria-describedby={[hint ? hintId : "", error ? errorId : ""]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.areaCode} value={formatLocalAuthorityOption(option)} />
        ))}
      </datalist>
      {hint && <p id={hintId} className="hint">{hint}</p>}
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}

function RequiredIndicator() {
  return (
    <>
      <span className="required-indicator" aria-hidden="true">
        *
      </span>
      <span className="sr-only">required</span>
    </>
  );
}
