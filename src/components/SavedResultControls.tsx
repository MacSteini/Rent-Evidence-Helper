import { savedResultCopy } from "../content/uiCopy";

type SavedResultControlsProps = {
  onClear: () => void;
};

export function SavedResultControls({ onClear }: SavedResultControlsProps) {
  return (
    <section className="saved-result-panel" aria-labelledby="saved-result-title">
      <div>
        <h2 id="saved-result-title">{savedResultCopy.title}</h2>
        <p>{savedResultCopy.body}</p>
        <p className="hint">{savedResultCopy.clearNote}</p>
      </div>
      <button type="button" className="text-button" onClick={onClear}>
        {savedResultCopy.clearButton}
      </button>
    </section>
  );
}
