import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";

const localAuthorityLabels: Record<string, string> = {
  E06000023: "Bristol, City of (South West)",
  E07000178: "Oxford (South East)",
  E08000003: "Manchester (North West)",
  E09000009: "Ealing (London)",
  E09000022: "Lambeth (London)"
};

const pmiListingsResponse = {
  total_count: 2,
  listings: [
    {
      uprn: "do-not-render",
      address: "1 Hidden Address",
      postcode: "SW12 8AA",
      price: 2400,
      bedrooms: 1,
      property_type: "Flat",
      listed_date: "2026-05-01",
      distance_m: 210,
      url: "https://provider.example/rental-a"
    },
    {
      uprn: "do-not-render-2",
      address: "2 Hidden Address",
      postcode: "SW12 8AB",
      price: 2600,
      bedrooms: 1,
      property_type: "Flat",
      listed_date: "2026-05-02",
      distance_m: 320,
      url: "https://provider.example/rental-b"
    }
  ]
};

const pmiComparablesResponse = {
  total_count: 2,
  count: 2,
  comparables: [
    {
      uprn: "do-not-render-comparable",
      address: "3 Hidden Comparable Address",
      postcode: "SW12 8AA",
      price: 2300,
      date: "2026-04-01",
      bedrooms: 1,
      property_type: "Flat",
      distance_m: 210
    },
    {
      uprn: "do-not-render-comparable-2",
      address: "4 Hidden Comparable Address",
      postcode: "SW12 8AB",
      price: 2500,
      date: "2026-03-01",
      bedrooms: 1,
      property_type: "Flat",
      distance_m: 320
    }
  ]
};

const highPmiListingsResponse = {
  total_count: 10,
  listings: Array.from({ length: 10 }, (_, index) => ({
    uprn: `do-not-render-high-${index}`,
    address: `${index} Hidden Address`,
    postcode: "W2 5BQ",
    price: index < 5 ? 12424 : 12425,
    bedrooms: 4,
    property_type: "Flat",
    distance_m: 120 + index,
    url: `https://provider.example/high-${index}`
  }))
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function selectLocalAuthority(
  user: ReturnType<typeof userEvent.setup>,
  areaCode = "E09000022"
) {
  const postcode = screen.getByLabelText(/postcode/i);
  if (postcode instanceof HTMLInputElement && postcode.value === "") {
    await user.type(postcode, areaCode === "E09000009" ? "W2 5BQ" : "SW12 8AA");
  }

  const rentAmount = screen.getByLabelText(
    /^(current rent(?! before)|proposed new rent)/i,
    { selector: "input" }
  );
  if (rentAmount instanceof HTMLInputElement && rentAmount.value === "") {
    await user.type(rentAmount, "2450");
  }

  const localAuthority = screen.getByLabelText(/local authority/i, {
    selector: "input"
  });
  await user.clear(localAuthority);
  await user.type(localAuthority, localAuthorityLabels[areaCode]);
}

async function forceAppRerender(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /privacy/i }));
  await user.keyboard("{Escape}");
}

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

  it("lets a user complete the default current-rent check with dispute support", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(
      screen.getByRole("link", { name: /Rent Evidence Helper home/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^Rent Evidence Helper$/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Office for National Statistics \(ONS\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/England rent benchmark and dispute support/i))
      .toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "v1.0.0" })
    ).toHaveAttribute(
      "href",
      "https://github.com/MacSteini/Rent-Evidence-Helper/blob/main/CHANGELOG.md"
    );
    expect(screen.queryByText(/England official rent benchmark/i))
      .not.toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: /scope and legal note/i })
    ).toHaveTextContent(/England only/i);
    expect(screen.getByLabelText(/postcode/i)).toHaveValue("");
    expect(
      screen.getByLabelText(/local authority/i, { selector: "input" })
    ).toHaveValue("");
    expect(
      screen.getByLabelText(/current rent/i, { selector: "input" })
    ).toHaveValue("");

    expect(
      screen.queryByRole("heading", { name: /your result will appear here/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/rent check result/i)).not.toBeInTheDocument();

    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByLabelText(/rent check result/i)
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
    expect(
      screen.getByRole("heading", {
        name: /^official area benchmark$/i,
        level: 2
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /your rent is .*official area benchmark/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /evidence summary/i })
    ).toBeInTheDocument();
    const evidenceSummaryPanel = screen.getByRole("region", {
      name: /evidence summary/i
    });
    expect(
      within(evidenceSummaryPanel).getByText(/^ONS benchmark only$/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^official area benchmark$/i })
    ).toBeInTheDocument();
    const officialBenchmarkPanel = screen.getByRole("region", {
      name: /^official area benchmark$/i
    });
    expect(
      within(officialBenchmarkPanel).getByText(/ONS monthly private rent estimate/i)
    ).toBeInTheDocument();
    expect(within(officialBenchmarkPanel).getByText("Lambeth")).toBeInTheDocument();
    expect(
      within(officialBenchmarkPanel).getByText(/one bedroom/i)
    ).toBeInTheDocument();
    expect(within(officialBenchmarkPanel).getByText("One bedroom"))
      .toBeInTheDocument();
    expect(
      within(officialBenchmarkPanel).getByText(/not a list of individual rental listings/i)
    ).toBeInTheDocument();
    expect(
      within(officialBenchmarkPanel).queryByText(/Comparable homes/i)
    ).not.toBeInTheDocument();
    expect(
      within(officialBenchmarkPanel).queryByText(/matched listings/i)
    ).not.toBeInTheDocument();
    expect(
      within(officialBenchmarkPanel).getByRole("link", {
        name: /ONS PIPR monthly price statistics/i
      })
    ).toHaveAttribute(
      "href",
      "https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics"
    );
    expect(screen.queryByText(/evidence confidence score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/how this score is calculated/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/comparable count up to 10 homes/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /comparable rents/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /comparable homes/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /run recent rented-record check/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/median comparable/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Comparables$/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /dispute support/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /choose a message template/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /formal notice query/i })
    ).not.toBeInTheDocument();
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toMatch(/postcode.*SW12 8AA/i);
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toMatch(/Local Authority benchmark, not a figure for the individual postcode/i);
    expect(
      screen.getByRole("heading", { name: /official routes to check/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /rent increase rules/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /assured tenancy forms/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /open market rent determination/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/timing rules before any proposed start date/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /renters’ rights act information/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /manual evidence/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /export|print|report/i })
    ).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses a user-owned PMI key for live listing evidence", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(pmiListingsResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(
      screen.getByRole("link", {
        name: /^Add your own Property Market Intel API key$/i
      })
    ).toHaveAttribute("href", "https://www.propertymarketintel.com/api-docs");
    expect(screen.queryByText(/Get a key from Property Market Intel/i))
      .not.toBeInTheDocument();
    expect(screen.queryByText(/full Bearer header/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Requests go from this browser to Property Market Intel/i)
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/property market intel api key/i),
      "pmi_live_test"
    );
    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    const livePanel = await screen.findByRole("heading", {
      name: /live rental listings/i
    });
    expect(livePanel).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /evidence summary/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Limited PMI context; median sits near your rent/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Use the ONS benchmark as the main result, then compare PMI listings/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/limited/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/small sample/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/live asking rents sit within 10% of your rent/i)
    ).toBeInTheDocument();
    await user.click(screen.getByText(/what this means/i));
    expect(
      screen.getByText(/Limited live context means PMI returned data/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Range spread compares the lowest and highest displayed asking rents/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Live asking rents are advertised prices/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/compare the live asking-rent listings with evidence you collect/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /your rent is well above the official area benchmark/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/exact addresses and UPRNs are not shown/i)).toBeInTheDocument();
    expect(screen.queryByText(/Hidden Address/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/do-not-render/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/v1/listings" }),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer pmi_live_test" })
      })
    );
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("/prices/comparables");
    const deeperRunButton = screen.getByRole("button", {
      name: /wait \d+s before running pmi again/i
    });
    expect(deeperRunButton).toBeDisabled();
    const deeperPanel = screen.getByRole("region", {
      name: /recent PMI rented records/i
    });
    expect(within(deeperPanel).getByText(/may cost 5 PMI credits/i))
      .toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/manual evidence/i)).not.toBeInTheDocument();
  });

  it("runs the recent PMI rented records only after explicit click", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: URL) => {
      if (String(url).includes("/prices/comparables")) {
        return Promise.resolve(
          new Response(JSON.stringify(pmiComparablesResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify(pmiListingsResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await user.type(
      screen.getByLabelText(/property market intel api key/i),
      "pmi_live_test"
    );
    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    await screen.findByRole("heading", { name: /live rental listings/i });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: /wait \d+s before running pmi again/i })
    ).toBeDisabled();

    nowSpy.mockReturnValue(1_010_000);
    await forceAppRerender(user);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /run recent rented-record check/i })
      ).toBeEnabled()
    );

    await user.click(
      screen.getByRole("button", { name: /run recent rented-record check/i })
    );

    expect(
      await screen.findByText(/recent PMI rented records available/i)
    ).toBeInTheDocument();
    const deeperPanel = screen.getByRole("region", {
      name: /recent PMI rented records/i
    });
    expect(within(deeperPanel).getByText("SW12 8 Postcode sector"))
      .toBeInTheDocument();
    expect(within(deeperPanel).getByText(/median record rent/i))
      .toBeInTheDocument();
    expect(within(deeperPanel).getAllByText(/record date/i).length)
      .toBeGreaterThan(0);
    expect(
      within(deeperPanel).getByText(/historical rented records, not current live adverts/i)
    ).toBeInTheDocument();
    expect(within(deeperPanel).getAllByText(/^£2,400$/i).length)
      .toBeGreaterThan(0);
    expect(screen.queryByText(/Hidden Comparable Address/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/do-not-render-comparable/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /your rent is well above the official area benchmark/i
      })
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const comparableUrl = String(fetchMock.mock.calls[1][0]);
    expect(comparableUrl).toContain("/v1/prices/comparables");
    expect(comparableUrl).toContain("type=rented");
    expect(comparableUrl).toContain("postcode=SW12+8");
    expect(comparableUrl).toContain("min_date=");
    expect(comparableUrl).toContain("max_date=");
    expect(comparableUrl).not.toContain("SW12+8AA");
  });

  it("separates empty current listings from recent rented records", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: URL) => {
      if (String(url).includes("/prices/comparables")) {
        return Promise.resolve(
          new Response(JSON.stringify(pmiComparablesResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ total_count: 0, listings: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await user.type(
      screen.getByLabelText(/property market intel api key/i),
      "pmi_live_test"
    );
    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/no current live rental listings for this outcode/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /live rental listings/i }))
      .not.toBeInTheDocument();

    nowSpy.mockReturnValue(1_010_000);
    await forceAppRerender(user);
    await user.click(
      screen.getByRole("button", { name: /run recent rented-record check/i })
    );

    expect(
      await screen.findByText(/recent PMI rented records available/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/historical rented records are shown separately below/i)
    ).toBeInTheDocument();
  });

  it("shows a deeper comparable warning without breaking ONS and live evidence", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: URL) => {
      if (String(url).includes("/prices/comparables")) {
        return Promise.resolve(
          new Response(JSON.stringify({ detail: "credit limit reached" }), {
            status: 402,
            headers: { "Content-Type": "application/json" }
          })
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify(pmiListingsResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await user.type(
      screen.getByLabelText(/property market intel api key/i),
      "pmi_live_test"
    );
    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));
    await screen.findByRole("heading", { name: /live rental listings/i });
    nowSpy.mockReturnValue(1_010_000);
    await forceAppRerender(user);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /run recent rented-record check/i })
      ).toBeEnabled()
    );

    await user.click(
      screen.getByRole("button", { name: /run recent rented-record check/i })
    );

    expect(await screen.findByText(/quota or rate limit/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^official area benchmark$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /live rental listings/i })
    ).toBeInTheDocument();
  });

  it("falls back to ONS when PMI rejects the key", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "bad key" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        })
      )
    );

    render(<App />);

    await user.type(screen.getByLabelText(/property market intel api key/i), "bad-key");
    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(await screen.findByText(/property market intel rejected the api key/i))
      .toBeInTheDocument();
    expect(screen.queryByText(/PMI unavailable/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Current PMI live listings unavailable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^official area benchmark$/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /live rental listings/i })
    ).not.toBeInTheDocument();
  });

  it("paces repeated PMI listing checks while keeping ONS available", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(pmiListingsResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await user.type(
      screen.getByLabelText(/property market intel api key/i),
      "pmi_live_test"
    );
    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));
    await screen.findByRole("heading", { name: /live rental listings/i });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(1_001_200);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/free tier allows 2 requests per 10 seconds/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^official area benchmark$/i })
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(1_010_000);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("stores a PMI key only when the user opts in and can clear it", async () => {
    const user = userEvent.setup();

    render(<App />);

    const keyInput = screen.getByLabelText(/property market intel api key/i);
    await user.type(keyInput, "pmi_live_test");

    expect(window.sessionStorage.getItem("market-rent-check-pmi-api-key")).toBe(
      "pmi_live_test"
    );
    expect(window.localStorage.getItem("market-rent-check-pmi-api-key")).toBeNull();

    await user.click(screen.getByLabelText(/remember on this device/i));
    expect(window.localStorage.getItem("market-rent-check-pmi-api-key")).toBe(
      "pmi_live_test"
    );

    await user.click(screen.getByRole("button", { name: /clear key/i }));
    expect(keyInput).toHaveValue("");
    expect(window.sessionStorage.getItem("market-rent-check-pmi-api-key")).toBeNull();
    expect(window.localStorage.getItem("market-rent-check-pmi-api-key")).toBeNull();
  });

  it("keeps the existing result visible when only the PMI key changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(await screen.findByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /evidence summary/i })
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/property market intel api key/i),
      "pmi_live_test"
    );

    expect(screen.getByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /evidence summary/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear key/i }));

    expect(screen.getByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /evidence summary/i })
    ).toBeInTheDocument();
  });

  it("requires a manually selected Local Authority before running a check", async () => {
    const user = userEvent.setup();
    render(<App />);

    const localAuthority = screen.getByLabelText(/local authority/i, {
      selector: "input"
    });
    expect(localAuthority).toHaveValue("");
    expect(
      document.querySelector('datalist option[value="Lambeth (London)"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('datalist option[value="Manchester (North West)"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('datalist option[value="Bristol, City of (South West)"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('datalist option[value="Oxford (South East)"]')
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/postcode/i), "SW12 8AA");
    await user.type(
      screen.getByLabelText(/current rent/i, { selector: "input" }),
      "2450"
    );
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/select the rental property’s local authority/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/rent check result/i)).not.toBeInTheDocument();
    await waitFor(() => expect(localAuthority).toHaveFocus());
  });

  it("keeps Situation at the end so formal notice questions follow it", async () => {
    const user = userEvent.setup();
    render(<App />);

    const condition = screen.getByLabelText(/condition/i, { selector: "select" });
    const situation = screen.getByLabelText(/situation/i, { selector: "select" });
    expect(
      Boolean(condition.compareDocumentPosition(situation) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true);

    await user.selectOptions(situation, "formal-form-4a-section-13");

    expect(
      Boolean(
        situation.compareDocumentPosition(screen.getByText(/optional notice questions/i)) &
          Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);
  });

  it("shows proposed-increase rent context only for increase situations", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByLabelText(/current rent/i, { selector: "input" }))
      .toBeInTheDocument();
    expect(
      screen.queryByLabelText(/current rent before increase/i)
    ).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /situation/i }),
      "informal-proposed-increase"
    );

    expect(screen.getByLabelText(/proposed new rent/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/current rent before increase/i)
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/current rent before increase/i));
    await user.type(screen.getByLabelText(/current rent before increase/i), "2500");
    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/enter a current rent below the proposed new rent/i)
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/current rent before increase/i)).toHaveFocus()
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /situation/i }),
      "formal-form-4a-section-13"
    );

    expect(screen.getByLabelText(/proposed new rent/i)).toBeInTheDocument();
    expect(screen.getByText(/optional notice questions/i)).toBeInTheDocument();
  });

  it("updates and copies a dispute support template", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    await selectLocalAuthority(user);
    await user.selectOptions(
      screen.getByRole("combobox", { name: /situation/i }),
      "informal-proposed-increase"
    );
    await user.type(screen.getByLabelText(/current rent before increase/i), "1800");
    await user.click(screen.getByRole("button", { name: /start check/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/editable message/i)).toHaveValue()
    );
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toContain("Dear Landlord/Landlady/Agent");
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toContain("My current rent is £1,800 per month");
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toContain("ONS monthly private rent estimate");
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toMatch(/postcode.*SW12 8AA/i);
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).not.toContain("comparable data points");
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toContain("similar nearby properties or agreed lettings");

    await user.click(
      screen.getByRole("checkbox", { name: /include ONS benchmark summary/i })
    );

    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).not.toContain("ONS monthly private rent estimate");

    await user.click(
      screen.getByRole("button", { name: /copy this message/i })
    );

    expect(writeText).toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: /message copied/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("warns when a generated dispute message may weaken the user’s position", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(highPmiListingsResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
    );

    render(<App />);

    await user.type(
      screen.getByLabelText(/property market intel api key/i),
      "pmi_live_test"
    );
    await selectLocalAuthority(user, "E09000009");
    await user.clear(screen.getByLabelText(/postcode/i));
    await user.type(screen.getByLabelText(/postcode/i), "W25BQ");
    await user.clear(screen.getByLabelText(/current rent/i, { selector: "input" }));
    await user.type(
      screen.getByLabelText(/current rent/i, { selector: "input" }),
      "2200"
    );
    await user.clear(screen.getByLabelText(/bedrooms/i));
    await user.type(screen.getByLabelText(/bedrooms/i), "4");
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/this message may weaken your position/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/ONS Local Authority benchmark is more than 10% higher/i)
        .length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /left out because it may weaken this message: the ONS Local Authority benchmark is more than 10% higher/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /include ons benchmark summary/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: /include pmi live-listings context/i })
    ).toBeDisabled();

    const message = screen.getByLabelText(
      /editable message/i
    ) as HTMLTextAreaElement;
    expect(message.value).toContain("postcode I entered is W25BQ");
    expect(message.value).not.toContain("ONS monthly private rent estimate");
    expect(message.value).not.toContain("£12,424.50");
    expect(
      screen.getByRole("button", { name: /copy this message/i })
    ).toBeInTheDocument();
  });

  it("shows formal notice support only for Form 4A or section 13 situations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectLocalAuthority(user);
    await user.selectOptions(
      screen.getByRole("combobox", { name: /situation/i }),
      "formal-form-4a-section-13"
    );
    await user.type(screen.getByLabelText(/date notice was received/i), "2026-06-01");
    await user.type(
      screen.getByLabelText(/date proposed increase would start/i),
      "2026-07-01"
    );
    await user.click(screen.getByRole("checkbox", { name: /form 4a/i }));
    await user.click(screen.getByRole("button", { name: /start check/i }));

    const templateSelect = await screen.findByRole("combobox", {
      name: /choose a message template/i
    });
    expect(
      screen.getByRole("option", { name: /formal notice query/i })
    ).toBeInTheDocument();

    await user.selectOptions(templateSelect, "formal-notice-query");

    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toContain("Form 4A / section 13 notice");
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toContain("notice received: 2026-06-01");
    expect(
      (screen.getByLabelText(/editable message/i) as HTMLTextAreaElement).value
    ).toContain("proposed start date: 2026-07-01");
  });

  it("restores a completed check after refresh", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByLabelText(/rent check result/i)
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeTruthy();

    firstRender.unmount();
    render(<App />);

    expect(screen.getByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postcode/i)).toHaveValue("SW12 8AA");
    expect(
      screen.getByLabelText(/local authority/i, { selector: "input" })
    ).toHaveValue("Lambeth (London)");
    expect(
      screen.getByRole("heading", { name: /^official area benchmark$/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /situation/i })).toHaveValue(
      "current-rent-only"
    );
  });

  it("lets the user clear the saved result without clearing the PMI key", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByLabelText(/rent check result/i)
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeTruthy();

    window.localStorage.setItem("market-rent-check-pmi-api-key", "pmi_live_test");

    expect(
      screen.getByRole("region", { name: /saved result/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not clear your property market intel api key/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear saved result/i }));

    expect(screen.queryByLabelText(/rent check result/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeNull();
    expect(window.localStorage.getItem("market-rent-check-pmi-api-key")).toBe(
      "pmi_live_test"
    );
    expect(
      screen.getByLabelText(/local authority/i, { selector: "input" })
    ).toHaveValue("");
    expect(screen.getByLabelText(/postcode/i)).toHaveValue("");
    expect(
      screen.getByLabelText(/current rent/i, { selector: "input" })
    ).toHaveValue("");
  });

  it("restores saved deeper comparable evidence after refresh without requiring a key", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: URL) => {
      if (String(url).includes("/prices/comparables")) {
        return Promise.resolve(
          new Response(JSON.stringify(pmiComparablesResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify(pmiListingsResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const firstRender = render(<App />);

    await user.type(
      screen.getByLabelText(/property market intel api key/i),
      "pmi_live_test"
    );
    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));
    await screen.findByRole("heading", { name: /live rental listings/i });
    nowSpy.mockReturnValue(1_010_000);
    await forceAppRerender(user);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /run recent rented-record check/i })
      ).toBeEnabled()
    );
    await user.click(
      screen.getByRole("button", { name: /run recent rented-record check/i })
    );
    expect(
      await screen.findByText(/recent PMI rented records available/i)
    ).toBeInTheDocument();

    window.sessionStorage.clear();
    firstRender.unmount();
    render(<App />);

    expect(
      screen.getByText(/recent PMI rented records available/i)
    ).toBeInTheDocument();
    const deeperPanel = screen.getByRole("region", {
      name: /recent PMI rented records/i
    });
    expect(within(deeperPanel).getAllByText(/^£2,400$/i).length)
      .toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /run recent rented-record check/i })
    ).not.toBeInTheDocument();
  });

  it("discards old stored checks that do not include a Local Authority", () => {
    window.localStorage.setItem(
      "market-rent-check-last-check",
      JSON.stringify({
        version: 1,
        input: {
          postcode: "SW12 8AA",
          rentAmount: 2450,
          rentPeriod: "month",
          propertyType: "flat",
          bedrooms: 2,
          tenancyContext: "current-rent-only"
        },
        result: {
          input: {
            postcode: "SW12 8AA",
            rentAmount: 2450,
            rentPeriod: "month",
            propertyType: "flat",
            bedrooms: 2,
            tenancyContext: "current-rent-only"
          },
          searchResult: {
            comparables: [],
            providerName: "Local comparable evidence",
            searchedAt: "2026-05-29T00:00:00Z",
            searchAreaDescription: "SW12 8 and nearby sectors",
            warnings: [],
            errors: []
          },
          estimate: {
            userRentMonthly: 2450,
            userRentAnnual: 29400,
            estimatedRangeLabel: "Unavailable",
            comparableCount: 0,
            status: "insufficient_evidence",
            confidence: "low",
            confidenceScore: 0,
            warnings: [],
            methodologyNotes: []
          }
        },
        savedAt: "2026-05-29T00:00:00Z"
      })
    );

    render(<App />);

    expect(screen.queryByLabelText(/rent check result/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeNull();
  });

  it("blocks clearly unsupported non-England postcode areas", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectLocalAuthority(user);
    await user.click(screen.getByRole("button", { name: /start check/i }));
    expect(
      await screen.findByLabelText(/rent check result/i)
    ).toBeInTheDocument();

    const postcode = screen.getByLabelText(/postcode/i);
    await user.clear(postcode);
    await user.type(postcode, "CF10 1EP");
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/outside the England scope/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(screen.getByText(/no result available/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /dispute support/i })
    ).not.toBeInTheDocument();
    await waitFor(() => expect(postcode).toHaveFocus());
  });

  it("normalises postcode input and visually marks required fields without label drift", async () => {
    const user = userEvent.setup();
    render(<App />);

    const postcode = screen.getByLabelText(/postcode/i);
    await user.clear(postcode);
    await user.type(postcode, "sw12-8aa<script>");

    expect(postcode).toHaveValue("SW128AAS");
    expect(
      screen.queryByText(/^required$/i, { selector: ":not(.sr-only)" })
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("*")).toHaveLength(3);
  });

  it("validates editable input correctness before running a check", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectLocalAuthority(user);
    const rentAmount = screen.getByLabelText(/current rent/i, {
      selector: "input"
    });
    await user.clear(rentAmount);
    await user.type(rentAmount, "£0<script>");
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/enter a rent amount greater than zero/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/rent check result/i)).not.toBeInTheDocument();

    await user.clear(rentAmount);
    await user.type(rentAmount, "2450");
    await user.clear(screen.getByLabelText(/bathrooms/i));
    await user.type(screen.getByLabelText(/bathrooms/i), "11");
    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/enter a bathroom count between 0 and 10/i)
    ).toBeInTheDocument();
  });

  it("removes stale result panels before blocked follow-up submits", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectLocalAuthority(user);
    await user.selectOptions(
      screen.getByRole("combobox", { name: /situation/i }),
      "informal-proposed-increase"
    );
    await user.click(screen.getByRole("button", { name: /start check/i }));
    expect(await screen.findByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /dispute support/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start check/i }));

    expect(
      await screen.findByText(/please wait a moment before starting another check/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(screen.getByText(/no result available/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /dispute support/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /manual evidence/i })
    ).not.toBeInTheDocument();
  });

  it("clears stale result panels as soon as form input changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectLocalAuthority(user);
    await user.selectOptions(
      screen.getByRole("combobox", { name: /situation/i }),
      "informal-proposed-increase"
    );
    await user.click(screen.getByRole("button", { name: /start check/i }));
    expect(await screen.findByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /dispute support/i })
    ).toBeInTheDocument();

    const postcode = screen.getByLabelText(/postcode/i);
    await user.clear(postcode);
    await user.type(postcode, "BN252D");

    expect(screen.getByLabelText(/rent check result/i)).toBeInTheDocument();
    expect(screen.getByText(/result cleared/i)).toBeInTheDocument();
    expect(
      screen.getByText(/previous result was cleared because the form changed/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /dispute support/i })
    ).not.toBeInTheDocument();
  });
});
