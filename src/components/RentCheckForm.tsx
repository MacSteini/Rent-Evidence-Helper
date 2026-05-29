import { useId, useState, type FormEvent } from "react";
import { InfoButton } from "./InfoButton";
import { fieldCopy, fieldHelpCopy } from "../content/uiCopy";
import { isValidPostcode } from "../lib/postcode";
import type {
  FurnishedStatus,
  PropertyCondition,
  PropertyType,
  RentPeriod,
  RentSearchInput,
  TenancyContext
} from "../types/rent";

type RentCheckFormProps = {
  initialInput: RentSearchInput;
  isChecking: boolean;
  error: string | null;
  onSubmit: (input: RentSearchInput) => void;
};

type FormErrors = Partial<Record<keyof RentSearchInput, string>>;

export function RentCheckForm({
  initialInput,
  isChecking,
  error,
  onSubmit
}: RentCheckFormProps) {
  const [input, setInput] = useState<RentSearchInput>(initialInput);
  const [errors, setErrors] = useState<FormErrors>({});
  const formHintId = useId();

  function update<K extends keyof RentSearchInput>(key: K, value: RentSearchInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!isValidPostcode(input.postcode)) {
      nextErrors.postcode = "Enter a valid UK postcode.";
    }
    if (!Number.isFinite(input.rentAmount) || input.rentAmount <= 0) {
      nextErrors.rentAmount = "Enter a rent amount greater than zero.";
    }
    if (input.rentAmount > 50_000) {
      nextErrors.rentAmount = "Enter a monthly-equivalent rent below £50,000.";
    }
    if (input.bedrooms < 0 || input.bedrooms > 10) {
      nextErrors.bedrooms = "Enter a bedroom count between 0 and 10.";
    }
    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(input);
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit} aria-describedby={formHintId}>
      <div className="section-heading">
        <h2>Rent check details</h2>
        <p id={formHintId}>Required fields are marked with “required”.</p>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <TextField
        label="Postcode"
        value={input.postcode}
        required
        hint={fieldCopy.postcodeHint}
        error={errors.postcode}
        onChange={(value) => update("postcode", value)}
      />

      <div className="field-grid">
        <NumberField
          label="Rent amount"
          value={input.rentAmount}
          required
          hint={fieldCopy.rentHint}
          error={errors.rentAmount}
          onChange={(value) => update("rentAmount", value)}
        />
        <SelectField
          label="Rent period"
          value={input.rentPeriod}
          required
          options={[
            ["week", "Weekly"],
            ["month", "Monthly"],
            ["year", "Yearly"]
          ]}
          onChange={(value) => update("rentPeriod", value as RentPeriod)}
        />
      </div>

      <div className="field-grid">
        <SelectField
          label="Property type"
          value={input.propertyType}
          required
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
          required
          error={errors.bedrooms}
          onChange={(value) => update("bedrooms", value)}
        />
      </div>

      <div className="field-grid">
        <NumberField
          label="Bathrooms"
          value={input.bathrooms ?? 1}
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

      <SelectField
        label="Tenancy context"
        help={fieldHelpCopy.tenancyContext}
        value={input.tenancyContext}
        required
        options={[
          ["current-rent-only", "Current rent only"],
          ["informal-proposed-increase", "Landlord proposed an increase informally"],
          ["formal-form-4a-section-13", "Form 4A / section 13 notice"],
          ["not-sure", "Not sure"]
        ]}
        onChange={(value) => update("tenancyContext", value as TenancyContext)}
      />

      {input.tenancyContext === "formal-form-4a-section-13" && (
        <fieldset className="fieldset">
          <legend>Optional notice questions</legend>
          <TextField
            label="Date notice was received"
            type="date"
            value={input.noticeReceivedAt ?? ""}
            onChange={(value) => update("noticeReceivedAt", value)}
          />
          <TextField
            label="Date proposed increase would start"
            type="date"
            value={input.proposedIncreaseStartsAt ?? ""}
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

type TextFieldProps = {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  onChange: (value: string) => void;
};

function TextField({
  label,
  value,
  type = "text",
  required,
  hint,
  error,
  onChange
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {required && <span>required</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
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
  onChange: (value: number) => void;
};

function NumberField({
  label,
  value,
  required,
  hint,
  error,
  onChange
}: NumberFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {required && <span>required</span>}
      </label>
      <input
        id={id}
        type="number"
        min="0"
        step="1"
        value={value}
        required={required}
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
  options: Array<[string, string]>;
  onChange: (value: string) => void;
};

function SelectField({
  label,
  help,
  value,
  required,
  options,
  onChange
}: SelectFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <div className="label-row">
        <label htmlFor={id}>
          {label} {required && <span>required</span>}
        </label>
        {help && <InfoButton label={label}>{help}</InfoButton>}
      </div>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
