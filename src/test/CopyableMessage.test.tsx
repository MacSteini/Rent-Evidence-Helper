import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CopyableMessage } from "../components/CopyableMessage";

describe("CopyableMessage", () => {
  it("autosizes the editable message when content grows", async () => {
    const user = userEvent.setup();
    const originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "scrollHeight"
    );

    Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return this.value.length > 20 ? 140 : 72;
      }
    });

    render(<CopyableMessage message="Short message" />);

    const textarea = screen.getByLabelText(/editable message/i);
    expect(textarea).toHaveStyle({ height: "72px" });

    await user.type(textarea, " with enough extra text to make it taller");

    expect(textarea).toHaveStyle({ height: "140px" });

    if (originalScrollHeight) {
      Object.defineProperty(
        HTMLTextAreaElement.prototype,
        "scrollHeight",
        originalScrollHeight
      );
    }
  });

  it("shows feedback when clipboard copy fails", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true
    });

    render(<CopyableMessage message="Message to copy" />);

    await user.click(screen.getByRole("button", { name: /copy landlord message/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not be copied/i
    );
  });
});
