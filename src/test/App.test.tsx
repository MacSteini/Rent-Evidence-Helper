import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

describe("App", () => {
  it("shows accessible contextual help for selected form fields", async () => {
    const user = userEvent.setup();

    render(<App />);

    const billsHelp = screen.getByRole("button", {
      name: /more about bills included/i
    });
    expect(billsHelp).toHaveAttribute("aria-expanded", "false");

    await user.click(billsHelp);

    expect(billsHelp).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/does not adjust the estimate/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("heading", { name: /rent check details/i }));

    expect(billsHelp).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/does not adjust the estimate/i)
    ).not.toBeInTheDocument();

    await user.click(billsHelp);
    expect(billsHelp).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(billsHelp).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/does not adjust the estimate/i)
    ).not.toBeInTheDocument();
  });

  it("opens and closes the methodology and privacy dialogs", async () => {
    const user = userEvent.setup();

    render(<App />);

    const methodologyButton = screen.getByRole("button", {
      name: /how this works/i
    });
    await user.click(methodologyButton);

    expect(
      screen.getByRole("dialog", { name: /how this works/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/weekly rent is converted/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(methodologyButton).toHaveFocus();

    const privacyButton = screen.getByRole("button", { name: /privacy/i });
    await user.click(privacyButton);

    expect(
      screen.getByRole("dialog", { name: /privacy and data use/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/does not create an account/i)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(privacyButton).toHaveFocus();
  });

  it("lets a user complete the fixture rent check and copy a message", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    expect(
      screen.queryByRole("heading", { name: /your result will appear here/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/rent check result/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByRole("heading", {
        name: /your rent appears above comparable market evidence/i
      })
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/rent check result/i)).toHaveFocus()
    );
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
