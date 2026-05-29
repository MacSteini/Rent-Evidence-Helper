import { useId, useState, type KeyboardEvent } from "react";

type InfoButtonProps = {
  label: string;
  children: string;
};

export function InfoButton({ label, children }: InfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <span className="info-help" onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="info-button"
        aria-label={`More about ${label}`}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((current) => !current)}
      >
        ?
      </button>
      {isOpen && (
        <span id={contentId} className="info-popover">
          {children}
        </span>
      )}
    </span>
  );
}
