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
      screen.getByText(/bills can make rents harder to compare directly/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("heading", { name: /rent check details/i }));

    expect(billsHelp).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/bills can make rents harder to compare directly/i)
    ).not.toBeInTheDocument();

    await user.click(billsHelp);
    expect(billsHelp).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(billsHelp).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/bills can make rents harder to compare directly/i)
    ).not.toBeInTheDocument();
  });

  it("opens and closes the methodology, privacy and scope dialogs", async () => {
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

    const scopeButton = screen.getByRole("button", { name: /why this scope/i });
    await user.click(scopeButton);

    expect(
      screen.getByRole("dialog", { name: /why this is england only/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/wales uses occupation contracts/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /rent smart wales/i })
    ).toHaveAttribute("href", "https://rentsmart.gov.wales/en/rentersrights/");

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(scopeButton).toHaveFocus();
  });

  it("lets a user complete the rent check and copy a message", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    expect(
      screen.getByRole("complementary", { name: /scope and legal note/i })
    ).toHaveTextContent(/for rental properties in england only/i);

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
    expect(screen.getByText(/check official guidance before acting/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /apply for an open market rent determination/i })
    ).toHaveAttribute(
      "href",
      "https://www.gov.uk/guidance/apply-for-an-open-market-rent-determination"
    );
    expect(screen.getByText(/evidence confidence score/i)).toBeInTheDocument();
    expect(screen.getByText(/how this score is calculated/i)).toBeInTheDocument();
    expect(screen.getByText(/comparable count up to 10 homes/i)).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /comparable rents/i })).toBeInTheDocument();

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

  it("restores a completed check after refresh", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByRole("heading", {
        name: /your rent appears above comparable market evidence/i
      })
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeTruthy();

    firstRender.unmount();
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /your rent appears above comparable market evidence/i
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postcode/i)).toHaveValue("SW12 8AA");
    expect(screen.getByRole("combobox", { name: /tenancy context/i })).toHaveValue(
      "informal-proposed-increase"
    );
  });

  it("blocks clearly unsupported non-England postcode areas", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start check/i }));
    expect(
      await screen.findByRole("heading", {
        name: /your rent appears above comparable market evidence/i
      })
    ).toBeInTheDocument();

    const postcode = screen.getByLabelText(/postcode/i);
    await user.clear(postcode);
    await user.type(postcode, "CF10 1EP");
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/outside the England scope/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/rent check result/i)).not.toBeInTheDocument();
    await waitFor(() => expect(postcode).toHaveFocus());
  });
});
