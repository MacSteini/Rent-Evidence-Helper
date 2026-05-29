import { useEffect, useLayoutEffect, useRef, useState } from "react";

type CopyableMessageProps = {
  message: string;
};

export function CopyableMessage({ message }: CopyableMessageProps) {
  const [draft, setDraft] = useState(message);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(message);
    setCopied(false);
  }, [message]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft]);

  async function copyMessage() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
  }

  return (
    <section className="panel" aria-labelledby="message-title">
      <div className="section-heading">
        <p className="label">Optional template</p>
        <h2 id="message-title">Landlord or agent message</h2>
        <p>Edit this before using it. Contacting your landlord does not pause or extend any tribunal deadline.</p>
      </div>
      <label className="field">
        <span>Editable message</span>
        <textarea
          ref={textareaRef}
          value={draft}
          rows={1}
          onChange={(event) => {
            setDraft(event.target.value);
            setCopied(false);
          }}
        />
      </label>
      <button className="secondary-button" type="button" onClick={copyMessage}>
        Copy landlord message
      </button>
      {copied && <p className="success-message" role="status">Message copied.</p>}
    </section>
  );
}
