import { useEffect, useLayoutEffect, useRef, useState } from "react";

type CopyableMessageProps = {
  message: string;
};

export function CopyableMessage({ message }: CopyableMessageProps) {
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

  return (
    <section className="panel" aria-labelledby="message-title">
      <div className="section-heading">
        <h2 id="message-title">Optional message template</h2>
        <p>Edit this before using it. Sending a message does not pause or extend any tribunal deadline.</p>
      </div>
      <label className="field">
        <span>Editable message</span>
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
        {copyStatus === "copied" ? "Message copied." : "Copy message"}
      </button>
      {copyStatus === "failed" && (
        <p className="form-error" role="alert">
          The message could not be copied. Select the text and copy it manually.
        </p>
      )}
    </section>
  );
}
