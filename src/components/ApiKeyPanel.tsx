type ApiKeyPanelProps = {
  apiKey: string;
  rememberApiKey: boolean;
  onApiKeyChange: (apiKey: string) => void;
  onRememberChange: (remember: boolean) => void;
  onClear: () => void;
};

export function ApiKeyPanel({
  apiKey,
  rememberApiKey,
  onApiKeyChange,
  onRememberChange,
  onClear
}: ApiKeyPanelProps) {
  return (
    <section className="api-key-panel" aria-labelledby="api-key-title">
      <div className="section-heading">
        <h2 id="api-key-title">Live rental evidence</h2>
        <p>
          <a
            href="https://www.propertymarketintel.com/api-docs"
            target="_blank"
            rel="noreferrer"
          >
            Add your own Property Market Intel API key
          </a>{" "}
          to include live asking-rent listings. Without a key, the check uses
          the official ONS benchmark only.
        </p>
      </div>
      <div className="field api-key-field">
        <label htmlFor="pmi-api-key">Property Market Intel API key</label>
        <input
          id="pmi-api-key"
          type="password"
          value={apiKey}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onApiKeyChange(event.target.value)}
        />
        <p className="hint">
          Paste your Property Market Intel API key. The key stays in this tab
          unless you choose to remember it on this device.
        </p>
      </div>
      <div className="api-key-actions">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={rememberApiKey}
            onChange={(event) => onRememberChange(event.target.checked)}
          />
          Remember on this device
        </label>
        <button
          type="button"
          className="text-button"
          disabled={!apiKey}
          onClick={onClear}
        >
          Clear key
        </button>
      </div>
    </section>
  );
}
