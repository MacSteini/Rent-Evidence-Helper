import { useEffect, useLayoutEffect, useRef, useState } from "react";

type CopyableMessageProps = {
  message: string;
  title?: string;
  description?: string;
  textareaLabel?: string;
  copyLabel?: string;
  copiedLabel?: string;
  copyError?: string;
  className?: string;
  headingLevel?: "h2" | "h3";
};

export function CopyableMessage({
  message,
  title = "Optional message template",
  description = "Edit this before using it. Sending a message does not pause or extend any tribunal deadline.",
  textareaLabel = "Editable message",
  copyLabel = "Copy message",
  copiedLabel = "Message copied.",
  copyError = "The message could not be copied. Select the text and copy it manually.",
  className = "panel",
  headingLevel = "h2"
}: CopyableMessageProps) {
  const [draft, setDraft] = useState(message);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(message);
    setCopyStatus("idle");
  }, [message]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft]);

  useEffect(() => {
    if (copyStatus !== "copied") return undefined;

    const timeoutId = window.setTimeout(() => {
      setCopyStatus("idle");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  const Heading = headingLevel;

  return (
    <section className={className} aria-labelledby="message-title">
      <div className="section-heading">
        <Heading id="message-title">{title}</Heading>
        <p>{description}</p>
      </div>
      <label className="field">
        <span>{textareaLabel}</span>
        <textarea
          ref={textareaRef}
          value={draft}
          rows={1}
          onChange={(event) => {
            setDraft(event.target.value);
            setCopyStatus("idle");
          }}
        />
      </label>
      <button
        className="secondary-button"
        type="button"
        aria-live="polite"
        onClick={copyMessage}
      >
        {copyStatus === "copied" ? copiedLabel : copyLabel}
      </button>
      {copyStatus === "failed" && (
        <p className="form-error" role="alert">
          {copyError}
        </p>
      )}
    </section>
  );
}
