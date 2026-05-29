import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

type InfoButtonProps = {
  label: string;
  children: string;
};

export function InfoButton({ label, children }: InfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const contentId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        wrapperRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <span ref={wrapperRef} className="info-help" onKeyDown={handleKeyDown}>
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
