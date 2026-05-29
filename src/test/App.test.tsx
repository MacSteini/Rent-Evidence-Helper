import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

describe("App", () => {
  it("lets a user complete the fixture rent check and copy a message", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByRole("heading", {
        name: /your rent appears above comparable market evidence/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/fixture mode is active/i)).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /fixture comparable rents/i })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByLabelText(/editable message/i)).toHaveValue()
    );
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toContain("Dear Landlord/Agent");

    await user.click(
      screen.getByRole("button", { name: /copy landlord message/i })
    );

    expect(writeText).toHaveBeenCalled();
    expect(await screen.findByText(/message copied/i)).toBeInTheDocument();
  });
});
